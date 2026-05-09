import { buildLivozAiPrompt } from "@/lib/aiPrompt";
import {
  arrayBufferToBase64,
  fileToArrayBuffer,
  pcm16Base64ToWavBase64,
  validateAudioFile,
} from "@/lib/audio";
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

    const prompt = buildLivozAiPrompt({
      childName: child.name,
      language,
      level,
    });
    const reply = await generateGeminiText({
      apiKey: geminiApiKey,
      prompt,
      message: transcript,
    });

    const ttsAudio = await synthesizeGeminiSpeech({
      apiKey: geminiApiKey,
      text: reply,
    });
    const normalizedAudio = normalizeTtsAudio(ttsAudio.data, ttsAudio.mimeType);

    const conversation = await prisma.aiConversation.create({
      data: {
        childId,
        mode: ConversationMode.VOICE,
        userMessage: transcript,
        aiResponse: reply,
        language,
        level,
        audioUrl: null,
      },
    });

    return NextResponse.json({
      transcript,
      reply,
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
