import { toUser } from "@/lib/mappers";
import { getPrisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const prisma = getPrisma();
    const body = await request.json();
    const requiredFields = ["name", "email", "phone", "cpf", "password"];
    const missing = requiredFields.some((field) => !body[field]);

    if (missing) {
      return NextResponse.json({ message: "Preencha todos os campos para criar a conta." }, { status: 400 });
    }

    if (!body.acceptedTerms || !body.acceptedPrivacy || !body.confirmedResponsible) {
      return NextResponse.json({ message: "Confirme os aceites obrigatórios para continuar." }, { status: 400 });
    }

    if (body.password.length < 6) {
      return NextResponse.json({ message: "A senha precisa ter pelo menos 6 caracteres." }, { status: 400 });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: body.email.trim().toLowerCase() }, { cpf: body.cpf.trim() }],
      },
    });

    if (existingUser) {
      return NextResponse.json({ message: "Já existe uma conta com esse e-mail ou CPF." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(body.password, 10);

    const user = await prisma.user.create({
      data: {
        name: body.name.trim(),
        email: body.email.trim().toLowerCase(),
        phone: body.phone.trim(),
        cpf: body.cpf.trim(),
        passwordHash,
        acceptedTerms: body.acceptedTerms,
        acceptedPrivacy: body.acceptedPrivacy,
        confirmedResponsible: body.confirmedResponsible,
      },
    });

    return NextResponse.json({ user: toUser(user) }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Não foi possível criar a conta agora." }, { status: 500 });
  }
}
