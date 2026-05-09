import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    userId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { userId } = await context.params;

    if (!userId) {
      return NextResponse.json(
        { message: "Usuário não informado." },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
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
            progress: {
              orderBy: { updatedAt: "desc" },
              include: {
                lesson: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Usuário não encontrado." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        cpf: user.cpf,
        role: user.role,
        acceptedTerms: user.acceptedTerms,
        acceptedPrivacy: user.acceptedPrivacy,
        confirmedResponsible: user.confirmedResponsible,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        children: user.children.map((child) => ({
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
          progress: child.progress.map((progress) => ({
            id: progress.id,
            childId: progress.childId,
            lessonId: progress.lessonId,
            score: progress.score,
            completed: progress.completed,
            stars: progress.stars,
            attempts: progress.attempts,
            completedAt: progress.completedAt?.toISOString() ?? null,
            createdAt: progress.createdAt.toISOString(),
            updatedAt: progress.updatedAt.toISOString(),
            lesson: {
              id: progress.lesson.id,
              title: progress.lesson.title,
              description: progress.lesson.description,
              language: progress.lesson.language,
              level: progress.lesson.level,
              type: progress.lesson.type,
              active: progress.lesson.active,
            },
          })),
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
        })),
      },
    });
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    return NextResponse.json(
      { message: "Não foi possível carregar o perfil agora." },
      { status: 500 },
    );
  }
}
