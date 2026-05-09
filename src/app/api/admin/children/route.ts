import { SubscriptionStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const children = await prisma.child.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        age: true,
        schoolYear: true,
        targetLanguage: true,
        level: true,
        avatar: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        subscriptions: {
          orderBy: {
            createdAt: "desc",
          },
          include: {
            plan: {
              select: {
                id: true,
                name: true,
                slug: true,
                price: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(
      {
        children: children.map((child) => {
          const activeSubscription =
            child.subscriptions.find((subscription) => subscription.status === SubscriptionStatus.ACTIVE) ||
            child.subscriptions[0] ||
            null;

          return {
            id: child.id,
            name: child.name,
            age: child.age,
            schoolYear: child.schoolYear,
            targetLanguage: child.targetLanguage,
            level: child.level,
            avatar: child.avatar,
            createdAt: child.createdAt.toISOString(),
            responsible: child.user,
            activeSubscription: activeSubscription
              ? {
                  id: activeSubscription.id,
                  status: activeSubscription.status,
                  benefitType: activeSubscription.benefitType,
                  discountPercentage: activeSubscription.discountPercentage,
                  startsAt: activeSubscription.startsAt.toISOString(),
                  endsAt: activeSubscription.endsAt?.toISOString() ?? null,
                  plan: {
                    id: activeSubscription.plan.id,
                    name: activeSubscription.plan.name,
                    slug: activeSubscription.plan.slug,
                    price: activeSubscription.plan.price.toString(),
                  },
                }
              : null,
          };
        }),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erro ao listar crianças admin:", error);

    return NextResponse.json(
      { message: "Não foi possível listar as crianças agora." },
      { status: 500 },
    );
  }
}
