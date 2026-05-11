import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

type VerifyParentPinBody = {
  userId?: string;
  pin?: string;
};

function isValidPin(pin?: string) {
  return Boolean(pin && /^\d{4}$|^\d{6}$/.test(pin));
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as VerifyParentPinBody;
    const userId = body.userId?.trim();
    const pin = body.pin?.trim();

    if (!userId) {
      return NextResponse.json(
        { message: "Informe o responsável para validar o PIN.", valid: false },
        { status: 400 },
      );
    }

    if (!isValidPin(pin)) {
      return NextResponse.json(
        { message: "Informe um PIN válido.", valid: false },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        parentPinHash: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Responsável não encontrado.", valid: false },
        { status: 404 },
      );
    }

    if (!user.parentPinHash) {
      return NextResponse.json(
        { message: "PIN parental ainda não configurado.", valid: false },
        { status: 400 },
      );
    }

    const valid = await bcrypt.compare(pin || "", user.parentPinHash);

    return NextResponse.json({ valid }, { status: 200 });
  } catch (error) {
    console.error("Erro ao validar PIN parental:", error);

    return NextResponse.json(
      { message: "Não foi possível validar o PIN agora.", valid: false },
      { status: 500 },
    );
  }
}
