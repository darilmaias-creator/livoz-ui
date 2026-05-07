import { toChild, toUser } from "@/lib/mappers";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const prisma = getPrisma();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ message: "Sessão não encontrada." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        children: { orderBy: { createdAt: "asc" }, take: 1 },
        subscriptions: {
          where: { status: "ACTIVE" },
          include: { plan: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ message: "Conta não encontrada." }, { status: 404 });
    }

    return NextResponse.json({
      user: toUser(user),
      child: user.children[0] ? toChild(user.children[0]) : null,
      planName: user.subscriptions[0]?.plan.name || "Modo Gratuito",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Não foi possível carregar o perfil agora." }, { status: 500 });
  }
}
