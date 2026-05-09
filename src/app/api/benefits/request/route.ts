import {
  calculateMeritoBimestralDiscount,
  calculateProvaDesafioDiscount,
  getBenefitValidity,
  type BenefitType as LivozBenefitType,
} from "@/lib/benefits";
import { prisma } from "@/lib/prisma";
import { BenefitStatus, BenefitType } from "@prisma/client";
import { NextResponse } from "next/server";

type BenefitRequestBody = {
  userId?: string;
  childId?: string;
  type?: string;
  declaredIncome?: number | null;
  schoolAverage?: number | null;
  challengeGrade?: number | null;
};

const allowedTypes = new Set<LivozBenefitType>([
  "SOCIOEDUCATIVA",
  "MERITO_BIMESTRAL",
  "PROVA_DESAFIO",
]);

function isAllowedBenefitType(type: string): type is LivozBenefitType {
  return allowedTypes.has(type as LivozBenefitType);
}

function normalizeNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : Number.NaN;
}

function isGradeInRange(value: number | null): value is number {
  return value !== null && !Number.isNaN(value) && value >= 0 && value <= 10;
}

function addDays(days: number | null) {
  if (!days) return null;
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as BenefitRequestBody;
    const userId = body.userId?.trim();
    const childId = body.childId?.trim();
    const type = body.type?.trim().toUpperCase();

    if (!userId) {
      return NextResponse.json(
        { message: "Informe o responsável para solicitar o benefício." },
        { status: 400 },
      );
    }

    if (!childId) {
      return NextResponse.json(
        { message: "Informe a criança para solicitar o benefício." },
        { status: 400 },
      );
    }

    if (!type || !isAllowedBenefitType(type)) {
      return NextResponse.json(
        { message: "Tipo de benefício inválido." },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Responsável não encontrado." },
        { status: 404 },
      );
    }

    const child = await prisma.child.findFirst({
      where: {
        id: childId,
        userId,
      },
      select: { id: true },
    });

    if (!child) {
      return NextResponse.json(
        { message: "Criança não encontrada para este responsável." },
        { status: 404 },
      );
    }

    const declaredIncome = normalizeNumber(body.declaredIncome);
    const schoolAverage = normalizeNumber(body.schoolAverage);
    const challengeGrade = normalizeNumber(body.challengeGrade);
    let discountPercentage = 0;

    if (type === "SOCIOEDUCATIVA") {
      discountPercentage = 100;
    }

    if (type === "MERITO_BIMESTRAL") {
      if (!isGradeInRange(schoolAverage)) {
        return NextResponse.json(
          { message: "Informe uma média escolar entre 0 e 10." },
          { status: 400 },
        );
      }

      discountPercentage = calculateMeritoBimestralDiscount(schoolAverage);
    }

    if (type === "PROVA_DESAFIO") {
      if (!isGradeInRange(challengeGrade)) {
        return NextResponse.json(
          { message: "Informe uma nota da Prova Desafio entre 0 e 10." },
          { status: 400 },
        );
      }

      discountPercentage = calculateProvaDesafioDiscount(challengeGrade);
    }

    const benefitRequest = await prisma.benefitRequest.create({
      data: {
        userId,
        childId,
        type: type as BenefitType,
        status: BenefitStatus.PENDING,
        declaredIncome: declaredIncome !== null && !Number.isNaN(declaredIncome) ? declaredIncome : null,
        schoolAverage: schoolAverage !== null && !Number.isNaN(schoolAverage) ? schoolAverage : null,
        challengeGrade: challengeGrade !== null && !Number.isNaN(challengeGrade) ? challengeGrade : null,
        discountPercentage,
        expiresAt: addDays(getBenefitValidity(type)),
      },
    });

    return NextResponse.json(
      {
        benefitRequest: {
          id: benefitRequest.id,
          userId: benefitRequest.userId,
          childId: benefitRequest.childId,
          type: benefitRequest.type,
          status: benefitRequest.status,
          declaredIncome: benefitRequest.declaredIncome?.toString() ?? null,
          schoolAverage: benefitRequest.schoolAverage?.toString() ?? null,
          challengeGrade: benefitRequest.challengeGrade?.toString() ?? null,
          discountPercentage: benefitRequest.discountPercentage,
          submittedAt: benefitRequest.submittedAt.toISOString(),
          expiresAt: benefitRequest.expiresAt?.toISOString() ?? null,
          createdAt: benefitRequest.createdAt.toISOString(),
          updatedAt: benefitRequest.updatedAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Erro ao solicitar benefício:", error);
    return NextResponse.json(
      { message: "Não foi possível solicitar o benefício agora." },
      { status: 500 },
    );
  }
}
