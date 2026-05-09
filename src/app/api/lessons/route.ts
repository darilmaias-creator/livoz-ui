import { prisma } from "@/lib/prisma";
import { ChildLevel, LessonType, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

function normalizeLevel(level: string | null) {
  if (!level) return null;

  const normalized = level.trim().toUpperCase();
  if (normalized in ChildLevel) {
    return normalized as ChildLevel;
  }

  return "INVALID";
}

function normalizeType(type: string | null) {
  if (!type) return null;

  const normalized = type.trim().toUpperCase();
  if (normalized in LessonType) {
    return normalized as LessonType;
  }

  return "INVALID";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get("language")?.trim();
    const level = normalizeLevel(searchParams.get("level"));
    const type = normalizeType(searchParams.get("type"));

    if (level === "INVALID") {
      return NextResponse.json(
        { message: "Nível de missão inválido." },
        { status: 400 },
      );
    }

    if (type === "INVALID") {
      return NextResponse.json(
        { message: "Tipo de missão inválido." },
        { status: 400 },
      );
    }

    const where: Prisma.LessonWhereInput = {
      active: true,
      ...(language ? { language } : {}),
      ...(level ? { level } : {}),
      ...(type ? { type } : {}),
    };

    const lessons = await prisma.lesson.findMany({
      where,
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({
      lessons: lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        language: lesson.language,
        level: lesson.level,
        type: lesson.type,
        contentJson: lesson.contentJson,
        active: lesson.active,
        createdAt: lesson.createdAt.toISOString(),
        updatedAt: lesson.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Erro ao buscar missões:", error);
    return NextResponse.json(
      { message: "Não foi possível carregar as missões agora." },
      { status: 500 },
    );
  }
}
