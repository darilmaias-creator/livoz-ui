import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type ProgressBody = {
  childId?: string;
  lessonId?: string;
  score?: number;
  completed?: boolean;
  stars?: number;
};

function parseRequiredNumber(value: unknown) {
  if (value === undefined || value === null || value === "") return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function serializeProgress(progress: {
  id: string;
  childId: string;
  lessonId: string;
  score: number;
  completed: boolean;
  stars: number;
  attempts: number;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
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
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ProgressBody;
    const childId = body.childId?.trim();
    const lessonId = body.lessonId?.trim();

    if (!childId) {
      return NextResponse.json(
        { message: "Informe a criança para salvar o progresso." },
        { status: 400 },
      );
    }

    if (!lessonId) {
      return NextResponse.json(
        { message: "Informe a missão para salvar o progresso." },
        { status: 400 },
      );
    }

    const score = parseRequiredNumber(body.score);
    if (score === null) {
      return NextResponse.json(
        { message: "Informe uma pontuação válida para salvar o progresso." },
        { status: 400 },
      );
    }

    const stars = parseRequiredNumber(body.stars);
    if (stars === null) {
      return NextResponse.json(
        { message: "Informe a quantidade de estrelas para salvar o progresso." },
        { status: 400 },
      );
    }

    if (score < 0 || stars < 0) {
      return NextResponse.json(
        { message: "Pontuação e estrelas não podem ser negativas." },
        { status: 400 },
      );
    }

    const child = await prisma.child.findUnique({
      where: { id: childId },
      select: { id: true },
    });

    if (!child) {
      return NextResponse.json(
        { message: "Criança não encontrada." },
        { status: 404 },
      );
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true },
    });

    if (!lesson) {
      return NextResponse.json(
        { message: "Missão não encontrada." },
        { status: 404 },
      );
    }

    const completed = Boolean(body.completed);
    const completedAt = completed ? new Date() : null;

    const existingProgress = await prisma.progress.findUnique({
      where: {
        childId_lessonId: {
          childId,
          lessonId,
        },
      },
      select: { id: true },
    });

    const progress = await prisma.progress.upsert({
      where: {
        childId_lessonId: {
          childId,
          lessonId,
        },
      },
      create: {
        childId,
        lessonId,
        score,
        completed,
        stars,
        attempts: 1,
        completedAt,
      },
      update: {
        score,
        completed,
        stars,
        attempts: {
          increment: 1,
        },
        completedAt,
      },
    });

    return NextResponse.json(
      {
        message: existingProgress ? "Progresso atualizado com sucesso." : "Progresso criado com sucesso.",
        progress: serializeProgress(progress),
      },
      { status: existingProgress ? 200 : 201 },
    );
  } catch (error) {
    console.error("Erro ao salvar progresso:", error);
    return NextResponse.json(
      { message: "Não foi possível salvar o progresso agora." },
      { status: 500 },
    );
  }
}
