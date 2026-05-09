import { prisma } from "@/lib/prisma";
import { ConversationMode } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const childId = searchParams.get("childId")?.trim();

    if (!childId) {
      return NextResponse.json(
        { message: "Informe a criança para carregar o histórico." },
        { status: 400 },
      );
    }

    const child = await prisma.child.findUnique({
      where: { id: childId },
      select: { id: true },
    });

    if (!child) {
      return NextResponse.json(
        { message: "Não encontramos essa criança no Livoz." },
        { status: 404 },
      );
    }

    const conversations = await prisma.aiConversation.findMany({
      where: {
        childId,
        mode: ConversationMode.TEXT,
      },
      select: {
        id: true,
        userMessage: true,
        aiResponse: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    });

    return NextResponse.json({
      conversations: conversations.reverse().map((conversation) => ({
        id: conversation.id,
        userMessage: conversation.userMessage,
        aiResponse: conversation.aiResponse,
        createdAt: conversation.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Erro ao carregar histórico de conversa:", error);
    return NextResponse.json(
      { message: "Não foi possível carregar o histórico agora." },
      { status: 500 },
    );
  }
}
