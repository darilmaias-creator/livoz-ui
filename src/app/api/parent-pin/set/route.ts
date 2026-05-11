import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

type SetParentPinBody = {
  userId?: string;
  password?: string;
  pin?: string;
  confirmPin?: string;
};

function isValidPin(pin?: string) {
  return Boolean(pin && /^\d{4}$|^\d{6}$/.test(pin));
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SetParentPinBody;
    const userId = body.userId?.trim();
    const password = body.password || "";
    const pin = body.pin?.trim();
    const confirmPin = body.confirmPin?.trim();

    if (!userId) {
      return NextResponse.json(
        { message: "Informe o responsável para configurar o PIN." },
        { status: 400 },
      );
    }

    if (!password) {
      return NextResponse.json(
        { message: "Informe sua senha de login para alterar o PIN." },
        { status: 400 },
      );
    }

    if (!isValidPin(pin)) {
      return NextResponse.json(
        { message: "O PIN deve ter 4 ou 6 números." },
        { status: 400 },
      );
    }

    if (pin !== confirmPin) {
      return NextResponse.json(
        { message: "A confirmação do PIN não confere." },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        passwordHash: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Responsável não encontrado." },
        { status: 404 },
      );
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return NextResponse.json(
        { message: "Senha de login incorreta." },
        { status: 401 },
      );
    }

    const parentPinHash = await bcrypt.hash(pin || "", 10);

    await prisma.user.update({
      where: { id: userId },
      data: { parentPinHash },
      select: { id: true },
    });

    return NextResponse.json(
      { message: "PIN parental configurado com sucesso." },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erro ao configurar PIN parental:", error);

    return NextResponse.json(
      { message: "Não foi possível configurar o PIN agora." },
      { status: 500 },
    );
  }
}
