import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

type RegisterResponsibleBody = {
  name?: string;
  email?: string;
  phone?: string;
  cpf?: string;
  password?: string;
  acceptedTerms?: boolean;
  acceptedPrivacy?: boolean;
  confirmedResponsible?: boolean;
  authorizedChildUse?: boolean;
  acceptedAiPolicy?: boolean;
};

function sanitizeUser(user: {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  cpf: string | null;
  role: UserRole;
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
  confirmedResponsible: boolean;
  authorizedChildUse: boolean;
  acceptedAiPolicy: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    cpf: user.cpf,
    role: user.role,
    acceptedTerms: user.acceptedTerms,
    acceptedPrivacy: user.acceptedPrivacy,
    confirmedResponsible: user.confirmedResponsible,
    authorizedChildUse: user.authorizedChildUse,
    acceptedAiPolicy: user.acceptedAiPolicy,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterResponsibleBody;

    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const phone = body.phone?.trim();
    const cpf = body.cpf?.trim();
    const password = body.password;

    if (!name || !email || !phone || !cpf || !password) {
      return NextResponse.json(
        { message: "Preencha todos os campos obrigatórios para criar sua conta." },
        { status: 400 },
      );
    }

    if (
      !body.acceptedTerms ||
      !body.acceptedPrivacy ||
      !body.confirmedResponsible ||
      !body.authorizedChildUse ||
      !body.acceptedAiPolicy
    ) {
      return NextResponse.json(
        { message: "Confirme todos os consentimentos obrigatórios para criar a conta." },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "A senha precisa ter pelo menos 6 caracteres." },
        { status: 400 },
      );
    }

    const userWithEmail = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (userWithEmail) {
      return NextResponse.json(
        { message: "Já existe uma conta cadastrada com esse e-mail." },
        { status: 409 },
      );
    }

    const userWithCpf = await prisma.user.findUnique({
      where: { cpf },
      select: { id: true },
    });

    if (userWithCpf) {
      return NextResponse.json(
        { message: "Já existe uma conta cadastrada com esse CPF." },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        cpf,
        passwordHash,
        role: UserRole.RESPONSAVEL,
        acceptedTerms: body.acceptedTerms,
        acceptedPrivacy: body.acceptedPrivacy,
        confirmedResponsible: body.confirmedResponsible,
        authorizedChildUse: body.authorizedChildUse,
        acceptedAiPolicy: body.acceptedAiPolicy,
      },
    });

    return NextResponse.json(
      {
        message: "Conta do responsável criada com sucesso.",
        user: sanitizeUser(user),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Erro ao cadastrar responsável:", error);
    return NextResponse.json(
      { message: "Não foi possível criar a conta agora. Tente novamente em instantes." },
      { status: 500 },
    );
  }
}
