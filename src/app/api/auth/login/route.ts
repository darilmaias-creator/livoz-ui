import { toChild, toUser } from "@/lib/mappers";
import { getPrisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const prisma = getPrisma();
    const body = await request.json();

    if (!body.email || !body.password) {
      return NextResponse.json({ message: "Preencha e-mail e senha para entrar." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: body.email.trim().toLowerCase() },
      include: { children: { orderBy: { createdAt: "asc" }, take: 1 } },
    });

    if (!user) {
      return NextResponse.json({ message: "Esse e-mail não está cadastrado no Livoz." }, { status: 404 });
    }

    const passwordMatches = await bcrypt.compare(body.password, user.passwordHash);
    if (!passwordMatches) {
      return NextResponse.json({ message: "Senha incorreta. Tente novamente com calma." }, { status: 401 });
    }

    return NextResponse.json({
      user: toUser(user),
      child: user.children[0] ? toChild(user.children[0]) : null,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Não foi possível entrar agora." }, { status: 500 });
  }
}
