import { detectPersonalDataRisk, getSafetyRedirectMessage } from "@/lib/childSafety";
import { prisma } from "@/lib/prisma";
import { ChildLevel, ConversationMode } from "@prisma/client";
import { NextResponse } from "next/server";

type LiveTurnBody = {
  childId?: string;
  userMessage?: string;
  aiResponse?: string;
  language?: string;
  level?: string;
};

function normalizeLevel(level?: string) {
  const normalized = level?.trim().toUpperCase() || ChildLevel.INICIANTE;

  if (normalized in ChildLevel) {
    return normalized as ChildLevel;
  }

  return ChildLevel.INICIANTE;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LiveTurnBody;
    const childId = body.childId?.trim();
    const userMessage = body.userMessage?.trim();
    const language = body.language?.trim() || "english";
    const level = normalizeLevel(body.level);
    const aiResponse = body.aiResponse?.trim() || getSafetyRedirectMessage();

    if (!childId) {
      return NextResponse.json(
        { message: "Informe a criança para salvar a conversa." },
        { status: 400 },
      );
    }

    if (!userMessage) {
      return NextResponse.json(
        { message: "Nenhuma fala reconhecida para salvar." },
        { status: 400 },
      );
    }

    const child = await prisma.child.findUnique({
      where: { id: childId },
      select: { id: true },
    });

    if (!child) {
      return NextResponse.json(
        { message: "Criança não encontrada." },
        { status: 404 },
      );
    }

    const safeAiResponse = detectPersonalDataRisk(userMessage)
      ? getSafetyRedirectMessage()
      : aiResponse;
    const conversation = await prisma.aiConversation.create({
      data: {
        childId,
        mode: ConversationMode.VOICE,
        userMessage,
        aiResponse: safeAiResponse,
        language,
        level,
        audioUrl: null,
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json(
      {
        conversationId: conversation.id,
        reply: safeAiResponse,
        safetyRedirected: safeAiResponse !== aiResponse,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Erro ao salvar turno da conversa ao vivo:", error);

    return NextResponse.json(
      { message: "Não foi possível salvar a conversa ao vivo agora." },
      { status: 500 },
    );
  }
}
