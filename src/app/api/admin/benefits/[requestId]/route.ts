import { prisma } from "@/lib/prisma";
import { BenefitStatus, SubscriptionStatus } from "@prisma/client";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    requestId: string;
  }>;
};

type ReviewBenefitBody = {
  status?: string;
  adminNotes?: string;
};

function normalizeReviewStatus(status?: string) {
  const normalized = status?.trim().toUpperCase();

  if (normalized === BenefitStatus.APPROVED || normalized === BenefitStatus.REJECTED) {
    return normalized;
  }

  return null;
}

function serializeBenefitRequest(benefitRequest: {
  id: string;
  userId: string;
  childId: string;
  type: string;
  status: string;
  declaredIncome: { toString(): string } | null;
  schoolAverage: { toString(): string } | null;
  challengeGrade: { toString(): string } | null;
  discountPercentage: number;
  adminNotes: string | null;
  submittedAt: Date;
  reviewedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: benefitRequest.id,
    userId: benefitRequest.userId,
    childId: benefitRequest.childId,
    type: benefitRequest.type,
    status: benefitRequest.status,
    declaredIncome: benefitRequest.declaredIncome?.toString() ?? null,
    schoolAverage: benefitRequest.schoolAverage?.toString() ?? null,
    challengeGrade: benefitRequest.challengeGrade?.toString() ?? null,
    discountPercentage: benefitRequest.discountPercentage,
    adminNotes: benefitRequest.adminNotes,
    submittedAt: benefitRequest.submittedAt.toISOString(),
    reviewedAt: benefitRequest.reviewedAt?.toISOString() ?? null,
    expiresAt: benefitRequest.expiresAt?.toISOString() ?? null,
    createdAt: benefitRequest.createdAt.toISOString(),
    updatedAt: benefitRequest.updatedAt.toISOString(),
  };
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { requestId } = await context.params;
    const cleanRequestId = requestId?.trim();

    if (!cleanRequestId) {
      return NextResponse.json(
        { message: "Informe a solicitação de benefício." },
        { status: 400 },
      );
    }

    const body = (await request.json()) as ReviewBenefitBody;
    const status = normalizeReviewStatus(body.status);

    if (!status) {
      return NextResponse.json(
        { message: "Status inválido. Use APPROVED ou REJECTED." },
        { status: 400 },
      );
    }

    const existingRequest = await prisma.benefitRequest.findUnique({
      where: { id: cleanRequestId },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { message: "Solicitação de benefício não encontrada." },
        { status: 404 },
      );
    }

    const updatedRequest = await prisma.$transaction(async (tx) => {
      const reviewedRequest = await tx.benefitRequest.update({
        where: { id: cleanRequestId },
        data: {
          status,
          adminNotes: body.adminNotes?.trim() || null,
          reviewedAt: new Date(),
        },
      });

      if (status === BenefitStatus.APPROVED) {
        const activeSubscription = await tx.subscription.findFirst({
          where: {
            childId: reviewedRequest.childId,
            status: SubscriptionStatus.ACTIVE,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        if (activeSubscription) {
          await tx.subscription.update({
            where: { id: activeSubscription.id },
            data: {
              benefitType: reviewedRequest.type,
              discountPercentage: reviewedRequest.discountPercentage,
              endsAt: reviewedRequest.expiresAt,
              status: SubscriptionStatus.ACTIVE,
            },
          });
        } else {
          const freePlan = await tx.plan.findUnique({
            where: { slug: "modo-gratuito" },
            select: { id: true },
          });

          if (!freePlan) {
            throw new Error("FREE_PLAN_NOT_FOUND");
          }

          await tx.subscription.create({
            data: {
              userId: reviewedRequest.userId,
              childId: reviewedRequest.childId,
              planId: freePlan.id,
              status: SubscriptionStatus.ACTIVE,
              benefitType: reviewedRequest.type,
              discountPercentage: reviewedRequest.discountPercentage,
              endsAt: reviewedRequest.expiresAt,
            },
          });
        }
      }

      return reviewedRequest;
    });

    return NextResponse.json({
      benefitRequest: serializeBenefitRequest(updatedRequest),
    });
  } catch (error) {
    console.error("Erro ao revisar benefício:", error);
    return NextResponse.json(
      { message: "Não foi possível revisar a solicitação agora." },
      { status: 500 },
    );
  }
}
