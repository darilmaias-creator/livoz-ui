import { buildLivozAiPrompt } from "@/lib/aiPrompt";
import { GeminiRequestError, generateGeminiText, getGeminiApiKey } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";
import { ChildLevel, ConversationMode } from "@prisma/client";
import { NextResponse } from "next/server";

type ChatBody = {
  childId?: string;
  message?: string;
  language?: string;
  level?: string;
};

function normalizeLevel(level?: string) {
  const normalized = level?.trim().toUpperCase() || ChildLevel.INICIANTE;

  if (normalized in ChildLevel) {
    return normalized as ChildLevel;
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatBody;
    const childId = body.childId?.trim();
    const message = body.message?.trim();
    const language = body.language?.trim() || "english";
    const level = normalizeLevel(body.level);

    if (!childId) {
      return NextResponse.json(
        { message: "Informe a criança para iniciar a conversa." },
        { status: 400 },
      );
    }

    if (!message) {
      return NextResponse.json(
        { message: "Digite uma mensagem para conversar com a Livoz." },
        { status: 400 },
      );
    }

    if (!level) {
      return NextResponse.json(
        { message: "Nível de idioma inválido." },
        { status: 400 },
      );
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
        { message: "Chat com IA ainda não configurado no servidor." },
        { status: 500 },
      );
    }

    const prompt = buildLivozAiPrompt({
      childName: child.name,
      language,
      level,
    });
    const reply = await generateGeminiText({
      apiKey: geminiApiKey,
      prompt,
      message,
    });

    const conversation = await prisma.aiConversation.create({
      data: {
        childId,
        mode: ConversationMode.TEXT,
        userMessage: message,
        aiResponse: reply,
        language,
        level,
      },
    });

    return NextResponse.json({
      reply,
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

    console.error("Erro ao conversar com IA:", error);
    return NextResponse.json(
      { message: "Não foi possível responder agora. Tente novamente em instantes." },
      { status: 500 },
    );
  }
}
