import { BenefitStatus, PaymentStatus, SubscriptionStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [
      totalUsers,
      totalChildren,
      activeSubscriptions,
      pendingBenefitRequests,
      approvedPayments,
      pendingPayments,
      revenue,
      latestBenefitRequests,
      latestPayments,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.child.count(),
      prisma.subscription.count({
        where: {
          status: SubscriptionStatus.ACTIVE,
        },
      }),
      prisma.benefitRequest.count({
        where: {
          status: BenefitStatus.PENDING,
        },
      }),
      prisma.payment.count({
        where: {
          status: PaymentStatus.APPROVED,
        },
      }),
      prisma.payment.count({
        where: {
          status: PaymentStatus.PENDING,
        },
      }),
      prisma.payment.aggregate({
        where: {
          status: PaymentStatus.APPROVED,
        },
        _sum: {
          finalAmount: true,
        },
      }),
      prisma.benefitRequest.findMany({
        take: 5,
        orderBy: {
          submittedAt: "desc",
        },
        select: {
          id: true,
          type: true,
          status: true,
          discountPercentage: true,
          submittedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          child: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.payment.findMany({
        take: 5,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          provider: true,
          providerStatus: true,
          amount: true,
          discountPercentage: true,
          finalAmount: true,
          status: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          child: {
            select: {
              id: true,
              name: true,
            },
          },
          plan: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json(
      {
        totalUsers,
        totalChildren,
        activeSubscriptions,
        pendingBenefitRequests,
        approvedPayments,
        pendingPayments,
        estimatedRevenue: Number(revenue._sum.finalAmount || 0),
        latestBenefitRequests: latestBenefitRequests.map((request) => ({
          ...request,
          submittedAt: request.submittedAt.toISOString(),
        })),
        latestPayments: latestPayments.map((payment) => ({
          ...payment,
          amount: payment.amount.toString(),
          finalAmount: payment.finalAmount.toString(),
          createdAt: payment.createdAt.toISOString(),
        })),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erro ao carregar dashboard admin:", error);

    return NextResponse.json(
      { message: "Não foi possível carregar as métricas do admin." },
      { status: 500 },
    );
  }
}
