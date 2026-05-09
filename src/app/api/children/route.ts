import { prisma } from "@/lib/prisma";
import { BenefitType, ChildLevel, SubscriptionStatus } from "@prisma/client";
import { NextResponse } from "next/server";

type CreateChildBody = {
  userId?: string;
  name?: string;
  age?: number | string;
  schoolYear?: string;
  targetLanguage?: string;
  level?: ChildLevel | "iniciante" | "basico" | "intermediario";
  goal?: string;
  avatar?: string;
};

function normalizeLevel(level: CreateChildBody["level"]) {
  if (!level) return null;

  const normalized = String(level).trim().toUpperCase();
  if (normalized === "INICIANTE" || normalized === "BASICO" || normalized === "INTERMEDIARIO") {
    return normalized as ChildLevel;
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateChildBody;

    const userId = body.userId?.trim();
    const name = body.name?.trim();
    const age = Number(body.age);
    const schoolYear = body.schoolYear?.trim();
    const targetLanguage = body.targetLanguage?.trim();
    const level = normalizeLevel(body.level);
    const goal = body.goal?.trim() || null;
    const avatar = body.avatar?.trim() || null;

    if (!userId || !name || !body.age || !schoolYear || !targetLanguage || !level) {
      return NextResponse.json(
        { message: "Preencha os dados obrigatórios da criança para continuar." },
        { status: 400 },
      );
    }

    if (Number.isNaN(age) || age < 6 || age > 14) {
      return NextResponse.json(
        { message: "A idade da criança precisa estar entre 6 e 14 anos." },
        { status: 400 },
      );
    }

    const responsible = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!responsible) {
      return NextResponse.json(
        { message: "Responsável não encontrado. Faça o cadastro do responsável primeiro." },
        { status: 404 },
      );
    }

    const freePlan = await prisma.plan.findUnique({
      where: { slug: "modo-gratuito" },
    });

    if (!freePlan) {
      return NextResponse.json(
        { message: "Plano gratuito inicial não encontrado. Rode o seed do banco antes de continuar." },
        { status: 500 },
      );
    }

    const child = await prisma.child.create({
      data: {
        userId,
        name,
        age,
        schoolYear,
        targetLanguage,
        level,
        goal,
        avatar,
        subscriptions: {
          create: {
            userId,
            planId: freePlan.id,
            status: SubscriptionStatus.ACTIVE,
            benefitType: BenefitType.MODO_GRATUITO,
            discountPercentage: 0,
          },
        },
      },
      include: {
        subscriptions: {
          include: {
            plan: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Perfil da criança criado com sucesso.",
        child: {
          id: child.id,
          userId: child.userId,
          name: child.name,
          age: child.age,
          schoolYear: child.schoolYear,
          targetLanguage: child.targetLanguage,
          level: child.level,
          goal: child.goal,
          avatar: child.avatar,
          createdAt: child.createdAt.toISOString(),
          updatedAt: child.updatedAt.toISOString(),
          subscriptions: child.subscriptions.map((subscription) => ({
            id: subscription.id,
            userId: subscription.userId,
            childId: subscription.childId,
            planId: subscription.planId,
            status: subscription.status,
            benefitType: subscription.benefitType,
            discountPercentage: subscription.discountPercentage,
            startsAt: subscription.startsAt.toISOString(),
            endsAt: subscription.endsAt?.toISOString() ?? null,
            createdAt: subscription.createdAt.toISOString(),
            updatedAt: subscription.updatedAt.toISOString(),
            plan: {
              id: subscription.plan.id,
              name: subscription.plan.name,
              slug: subscription.plan.slug,
              price: subscription.plan.price.toString(),
              description: subscription.plan.description,
              limitsJson: subscription.plan.limitsJson,
              active: subscription.plan.active,
              createdAt: subscription.plan.createdAt.toISOString(),
              updatedAt: subscription.plan.updatedAt.toISOString(),
            },
          })),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Erro ao cadastrar criança:", error);
    return NextResponse.json(
      { message: "Não foi possível criar o perfil da criança agora. Tente novamente em instantes." },
      { status: 500 },
    );
  }
}
