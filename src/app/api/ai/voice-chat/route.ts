import { buildLivozAiPrompt } from "@/lib/aiPrompt";
import {
  arrayBufferToBase64,
  fileToArrayBuffer,
  pcm16Base64ToWavBase64,
  validateAudioFile,
} from "@/lib/audio";
import { detectPersonalDataRisk, getSafetyRedirectMessage } from "@/lib/childSafety";
import {
  GeminiRequestError,
  generateGeminiText,
  getGeminiApiKey,
  synthesizeGeminiSpeech,
  transcribeGeminiAudio,
} from "@/lib/gemini";
import { prisma } from "@/lib/prisma";
import { ChildLevel, ConversationMode } from "@prisma/client";
import { NextResponse } from "next/server";

function normalizeLevel(level?: string) {
  const normalized = level?.trim().toUpperCase() || ChildLevel.INICIANTE;

  if (normalized in ChildLevel) {
    return normalized as ChildLevel;
  }

  return null;
}

type StructuredVoiceReply = {
  reply: string;
  correction: string | null;
  newWord: {
    pt: string;
    en: string;
  } | null;
  challenge: string | null;
  stars: number;
  nextQuestion: string | null;
};

function extractJsonObject(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() || trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  return candidate.slice(start, end + 1);
}

function asNullableString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeStructuredReply(rawText: string): StructuredVoiceReply {
  const jsonText = extractJsonObject(rawText);

  if (!jsonText) {
    return {
      reply: rawText,
      correction: null,
      newWord: null,
      challenge: null,
      stars: 1,
      nextQuestion: null,
    };
  }

  try {
    const parsed = JSON.parse(jsonText) as Partial<StructuredVoiceReply>;
    const reply = asNullableString(parsed.reply) || rawText;
    const newWord =
      parsed.newWord &&
      typeof parsed.newWord === "object" &&
      asNullableString(parsed.newWord.pt) &&
      asNullableString(parsed.newWord.en)
        ? {
            pt: asNullableString(parsed.newWord.pt) || "",
            en: asNullableString(parsed.newWord.en) || "",
          }
        : null;
    const stars = Number(parsed.stars);

    return {
      reply,
      correction: asNullableString(parsed.correction),
      newWord,
      challenge: asNullableString(parsed.challenge),
      stars: Number.isFinite(stars) ? Math.max(0, Math.min(3, Math.round(stars))) : 1,
      nextQuestion: asNullableString(parsed.nextQuestion),
    };
  } catch {
    return {
      reply: rawText,
      correction: null,
      newWord: null,
      challenge: null,
      stars: 1,
      nextQuestion: null,
    };
  }
}

function normalizeTtsAudio(audioBase64: string, mimeType: string) {
  const normalizedMimeType = mimeType.toLowerCase();

  if (normalizedMimeType.includes("wav")) {
    return {
      audioBase64,
      audioMimeType: "audio/wav",
    };
  }

  if (normalizedMimeType.includes("pcm") || normalizedMimeType.includes("l16") || !normalizedMimeType) {
    return {
      audioBase64: pcm16Base64ToWavBase64(audioBase64),
      audioMimeType: "audio/wav",
    };
  }

  return {
    audioBase64,
    audioMimeType: mimeType,
  };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audio = formData.get("audio");
    const childId = formData.get("childId")?.toString().trim();
    const language = formData.get("language")?.toString().trim() || "english";
    const level = normalizeLevel(formData.get("level")?.toString());
    const conversationMode = formData.get("conversationMode")?.toString().trim() || "FREE_PRACTICE";
    const topic = formData.get("topic")?.toString().trim() || "tema livre adequado ao nível";

    if (!(audio instanceof File)) {
      return NextResponse.json(
        { message: "Envie um áudio para a Livoz escutar." },
        { status: 400 },
      );
    }

    if (!childId) {
      return NextResponse.json(
        { message: "Informe a criança para iniciar a conversa por voz." },
        { status: 400 },
      );
    }

    if (!level) {
      return NextResponse.json(
        { message: "Nível de idioma inválido." },
        { status: 400 },
      );
    }

    const audioError = validateAudioFile(audio);
    if (audioError) {
      return NextResponse.json({ message: audioError }, { status: 400 });
    }

    const child = await prisma.child.findUnique({
      where: { id: childId },
      select: {
        id: true,
        name: true,
        age: true,
        targetLanguage: true,
        level: true,
      },
    });

    if (!child) {
      return NextResponse.json(
        { message: "Não encontramos essa criança no Livoz." },
        { status: 404 },
      );
    }

    const geminiApiKey = getGeminiApiKey();
    if (!geminiApiKey) {
      return NextResponse.json(
        { message: "Conversa por voz ainda não configurada no servidor." },
        { status: 500 },
      );
    }

    const audioBase64 = arrayBufferToBase64(await fileToArrayBuffer(audio));
    const transcript = await transcribeGeminiAudio({
      apiKey: geminiApiKey,
      audioBase64,
      mimeType: audio.type || "audio/webm",
      language,
    });

    if (detectPersonalDataRisk(transcript)) {
      const safeReply = getSafetyRedirectMessage();
      const conversation = await prisma.aiConversation.create({
        data: {
          childId,
          mode: ConversationMode.VOICE,
          userMessage: transcript,
          aiResponse: safeReply,
          language,
          level,
          audioUrl: null,
        },
      });

      return NextResponse.json({
        transcript,
        reply: safeReply,
        correction: null,
        newWord: null,
        challenge: "Diga uma palavra em inglês que você já conhece.",
        stars: 0,
        nextQuestion: "Qual palavra em inglês você quer praticar agora?",
        audioBase64: "",
        audioMimeType: "",
        conversationId: conversation.id,
      });
    }

    const recentConversations = await prisma.aiConversation.findMany({
      where: { childId },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        userMessage: true,
        aiResponse: true,
      },
    });

    const prompt = buildLivozAiPrompt({
      childName: child.name,
      childAge: child.age,
      language: language || child.targetLanguage,
      level: level || child.level,
      conversationMode,
      topic,
      recentMessages: recentConversations.reverse(),
    });
    const rawReply = await generateGeminiText({
      apiKey: geminiApiKey,
      prompt,
      message: [
        "Responda exclusivamente em JSON valido, sem markdown.",
        "Formato obrigatorio:",
        "{\"reply\":\"texto principal curto\",\"correction\":null,\"newWord\":{\"pt\":\"gato\",\"en\":\"cat\"},\"challenge\":\"desafio curto\",\"stars\":2,\"nextQuestion\":\"pergunta simples\"}",
        "Use null quando nao houver correcao, palavra nova, desafio ou pergunta.",
        "stars deve ser um numero inteiro entre 0 e 3.",
        "",
        `Mensagem transcrita da crianca: ${transcript}`,
      ].join("\n"),
    });
    const structuredReply = normalizeStructuredReply(rawReply);

    const ttsAudio = await synthesizeGeminiSpeech({
      apiKey: geminiApiKey,
      text: structuredReply.reply,
    });
    const normalizedAudio = normalizeTtsAudio(ttsAudio.data, ttsAudio.mimeType);

    const conversation = await prisma.aiConversation.create({
      data: {
        childId,
        mode: ConversationMode.VOICE,
        userMessage: transcript,
        aiResponse: structuredReply.reply,
        language,
        level,
        audioUrl: null,
      },
    });

    return NextResponse.json({
      transcript,
      reply: structuredReply.reply,
      correction: structuredReply.correction,
      newWord: structuredReply.newWord,
      challenge: structuredReply.challenge,
      stars: structuredReply.stars,
      nextQuestion: structuredReply.nextQuestion,
      audioBase64: normalizedAudio.audioBase64,
      audioMimeType: normalizedAudio.audioMimeType,
      conversationId: conversation.id,
    });
  } catch (error) {
    if (error instanceof GeminiRequestError && error.status === 429) {
      const waitMessage = error.retryAfterSeconds
        ? ` Aguarde cerca de ${error.retryAfterSeconds} segundos e tente novamente.`
        : " Aguarde um pouco e tente novamente.";

      return NextResponse.json(
        { message: `A Livoz atingiu o limite temporário da IA.${waitMessage}` },
        { status: 429 },
      );
    }

    console.error("Erro ao conversar por voz:", error);
    return NextResponse.json(
      { message: "Não foi possível responder por voz agora. Tente novamente em instantes." },
      { status: 500 },
    );
  }
}
