import { SubscriptionStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

function normalizeSubscriptionStatus(status: string | null) {
  if (!status) {
    return null;
  }

  const normalized = status.trim().toUpperCase();

  if (normalized in SubscriptionStatus) {
    return normalized as SubscriptionStatus;
  }

  return "INVALID";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = normalizeSubscriptionStatus(searchParams.get("status"));

    if (status === "INVALID") {
      return NextResponse.json(
        { message: "Status de assinatura inválido." },
        { status: 400 },
      );
    }

    const subscriptions = await prisma.subscription.findMany({
      where: status ? { status } : undefined,
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        child: {
          select: {
            name: true,
          },
        },
        plan: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        subscriptions: subscriptions.map((subscription) => ({
          id: subscription.id,
          status: subscription.status,
          benefitType: subscription.benefitType,
          discountPercentage: subscription.discountPercentage,
          startsAt: subscription.startsAt.toISOString(),
          endsAt: subscription.endsAt?.toISOString() ?? null,
          stripeCustomerId: subscription.stripeCustomerId,
          stripeSubscriptionId: subscription.stripeSubscriptionId,
          user: subscription.user,
          child: subscription.child,
          plan: subscription.plan,
        })),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erro ao listar assinaturas admin:", error);

    return NextResponse.json(
      { message: "Não foi possível listar as assinaturas agora." },
      { status: 500 },
    );
  }
}
