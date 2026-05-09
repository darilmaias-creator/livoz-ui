import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const conversations = await prisma.aiConversation.findMany({
      take: 100,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        mode: true,
        language: true,
        level: true,
        createdAt: true,
        child: {
          select: {
            name: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(
      {
        conversations: conversations.map((conversation) => ({
          id: conversation.id,
          child: {
            name: conversation.child.name,
          },
          responsible: {
            name: conversation.child.user.name,
            email: conversation.child.user.email,
          },
          mode: conversation.mode,
          language: conversation.language,
          level: conversation.level,
          createdAt: conversation.createdAt.toISOString(),
        })),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erro ao listar conversas admin:", error);

    return NextResponse.json(
      { message: "Não foi possível listar as conversas agora." },
      { status: 500 },
    );
  }
}
