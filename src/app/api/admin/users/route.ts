import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

function maskCpf(cpf: string | null) {
  if (!cpf) {
    return null;
  }

  const digits = cpf.replace(/\D/g, "");

  if (digits.length !== 11) {
    return "***.***.***-**";
  }

  return `${digits.slice(0, 3)}.***.***-${digits.slice(9, 11)}`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();

    const users = await prisma.user.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { phone: { contains: search, mode: "insensitive" } },
              { cpf: { contains: search, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        cpf: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            children: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        users: users.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          cpf: maskCpf(user.cpf),
          role: user.role,
          createdAt: user.createdAt.toISOString(),
          childrenCount: user._count.children,
        })),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erro ao listar usuários admin:", error);

    return NextResponse.json(
      { message: "Não foi possível listar os responsáveis agora." },
      { status: 500 },
    );
  }
}
