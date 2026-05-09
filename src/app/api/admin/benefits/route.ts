import { prisma } from "@/lib/prisma";
import { BenefitStatus } from "@prisma/client";
import { NextResponse } from "next/server";

function normalizeStatus(status: string | null) {
  if (!status) return null;

  const normalized = status.trim().toUpperCase();
  if (normalized in BenefitStatus) {
    return normalized as BenefitStatus;
  }

  return "INVALID";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = normalizeStatus(searchParams.get("status"));

    if (status === "INVALID") {
      return NextResponse.json(
        { message: "Status de benefício inválido." },
        { status: 400 },
      );
    }

    const benefitRequests = await prisma.benefitRequest.findMany({
      where: status ? { status } : {},
      include: {
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
            age: true,
            schoolYear: true,
          },
        },
      },
      orderBy: {
        submittedAt: "desc",
      },
    });

    return NextResponse.json({
      benefitRequests: benefitRequests.map((benefitRequest) => ({
        id: benefitRequest.id,
        type: benefitRequest.type,
        status: benefitRequest.status,
        declaredIncome: benefitRequest.declaredIncome?.toString() ?? null,
        schoolAverage: benefitRequest.schoolAverage?.toString() ?? null,
        challengeGrade: benefitRequest.challengeGrade?.toString() ?? null,
        discountPercentage: benefitRequest.discountPercentage,
        submittedAt: benefitRequest.submittedAt.toISOString(),
        reviewedAt: benefitRequest.reviewedAt?.toISOString() ?? null,
        expiresAt: benefitRequest.expiresAt?.toISOString() ?? null,
        adminNotes: benefitRequest.adminNotes,
        user: benefitRequest.user,
        child: benefitRequest.child,
      })),
    });
  } catch (error) {
    console.error("Erro ao listar benefícios administrativos:", error);
    return NextResponse.json(
      { message: "Não foi possível listar as solicitações agora." },
      { status: 500 },
    );
  }
}
