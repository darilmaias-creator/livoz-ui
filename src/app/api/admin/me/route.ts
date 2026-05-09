import { NextResponse } from "next/server";

import { isAdminUser } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { message: "Usuário não informado.", isAdmin: false },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Usuário não encontrado.", isAdmin: false },
        { status: 404 },
      );
    }

    const isAdmin = await isAdminUser(userId);

    return NextResponse.json(
      {
        isAdmin,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erro ao verificar admin:", error);

    return NextResponse.json(
      { message: "Não foi possível verificar o acesso admin.", isAdmin: false },
      { status: 500 },
    );
  }
}
