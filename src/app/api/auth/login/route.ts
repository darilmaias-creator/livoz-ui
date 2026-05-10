import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

type LoginBody = {
  email?: string;
  password?: string;
};

function sanitizeUser(user: {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  cpf: string | null;
  role: string;
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
    const body = (await request.json()) as LoginBody;
    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Preencha e-mail e senha para entrar." },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        children: {
          orderBy: { createdAt: "asc" },
          include: {
            subscriptions: {
              orderBy: { createdAt: "desc" },
              include: {
                plan: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Não encontramos uma conta com esse e-mail." },
        { status: 404 },
      );
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return NextResponse.json(
        { message: "Senha incorreta. Confira os dados e tente novamente." },
        { status: 401 },
      );
    }

    const children = user.children.map((child) => ({
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
        planName: subscription.plan.name,
      })),
      currentPlan:
        child.subscriptions.find((subscription) => subscription.status === "ACTIVE")?.plan.name ??
        child.subscriptions[0]?.plan.name ??
        "Modo Gratuito",
    }));

    const firstChild = children[0] ?? null;
    const firstSubscription = firstChild?.subscriptions[0] ?? null;

    return NextResponse.json({
      message: "Login realizado com sucesso.",
      user: sanitizeUser(user),
      children,
      session: {
        userId: user.id,
        childId: firstChild?.id ?? null,
        userName: user.name,
        childName: firstChild?.name ?? null,
        planName: firstSubscription?.planName ?? firstChild?.currentPlan ?? "Modo Gratuito",
      },
    });
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    return NextResponse.json(
      { message: "Não foi possível entrar agora. Tente novamente em instantes." },
      { status: 500 },
    );
  }
}
