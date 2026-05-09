import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const childId = searchParams.get("childId")?.trim();

    if (!childId) {
      return NextResponse.json(
        { message: "Informe a criança para listar os benefícios." },
        { status: 400 },
      );
    }

    const benefitRequests = await prisma.benefitRequest.findMany({
      where: { childId },
      select: {
        id: true,
        type: true,
        status: true,
        declaredIncome: true,
        schoolAverage: true,
        challengeGrade: true,
        discountPercentage: true,
        submittedAt: true,
        reviewedAt: true,
        expiresAt: true,
        adminNotes: true,
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
      })),
    });
  } catch (error) {
    console.error("Erro ao listar benefícios:", error);
    return NextResponse.json(
      { message: "Não foi possível listar os benefícios agora." },
      { status: 500 },
    );
  }
}
