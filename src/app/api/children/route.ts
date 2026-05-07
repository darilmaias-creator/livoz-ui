import { toChild, toPrismaLevel } from "@/lib/mappers";
import { getPrisma } from "@/lib/prisma";
import type { Child } from "@/types/user";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const prisma = getPrisma();
    const body = (await request.json()) as Omit<Child, "id" | "createdAt">;

    if (!body.userId || !body.name || !body.age || !body.schoolYear || !body.targetLanguage || !body.level || !body.goal || !body.avatar) {
      return NextResponse.json({ message: "Preencha todos os campos da criança para finalizar." }, { status: 400 });
    }

    if (body.age < 6 || body.age > 14) {
      return NextResponse.json({ message: "A idade precisa estar entre 6 e 14 anos." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: body.userId } });
    if (!user) {
      return NextResponse.json({ message: "Responsável não encontrado. Faça o cadastro novamente." }, { status: 404 });
    }

    const freePlan = await prisma.plan.findUnique({ where: { slug: "modo-gratuito" } });

    const child = await prisma.child.create({
      data: {
        userId: body.userId,
        name: body.name.trim(),
        age: body.age,
        schoolYear: body.schoolYear,
        targetLanguage: body.targetLanguage,
        level: toPrismaLevel(body.level),
        goal: body.goal,
        avatar: body.avatar,
        subscriptions: freePlan
          ? {
              create: {
                userId: body.userId,
                planId: freePlan.id,
                status: "ACTIVE",
                benefitType: "MODO_GRATUITO",
              },
            }
          : undefined,
      },
    });

    return NextResponse.json({ child: toChild(child) }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Não foi possível salvar o perfil da criança agora." }, { status: 500 });
  }
}
