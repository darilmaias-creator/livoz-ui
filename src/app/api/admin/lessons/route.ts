import { ChildLevel, LessonType } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

function normalizeEnum<T extends Record<string, string>>(value: string | null, enumObject: T) {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toUpperCase();

  if (normalized in enumObject) {
    return normalized as T[keyof T];
  }

  return "INVALID";
}

function normalizeActive(value: string | null) {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === "true") return true;
  if (normalized === "false") return false;

  return "INVALID";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get("language")?.trim();
    const level = normalizeEnum(searchParams.get("level"), ChildLevel);
    const type = normalizeEnum(searchParams.get("type"), LessonType);
    const active = normalizeActive(searchParams.get("active"));

    if (level === "INVALID") {
      return NextResponse.json(
        { message: "Nível inválido." },
        { status: 400 },
      );
    }

    if (type === "INVALID") {
      return NextResponse.json(
        { message: "Tipo de missão inválido." },
        { status: 400 },
      );
    }

    if (active === "INVALID") {
      return NextResponse.json(
        { message: "Filtro active inválido. Use true ou false." },
        { status: 400 },
      );
    }

    const lessons = await prisma.lesson.findMany({
      where: {
        ...(language ? { language } : {}),
        ...(level ? { level } : {}),
        ...(type ? { type } : {}),
        ...(typeof active === "boolean" ? { active } : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        description: true,
        language: true,
        level: true,
        type: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        lessons: lessons.map((lesson) => ({
          ...lesson,
          createdAt: lesson.createdAt.toISOString(),
          updatedAt: lesson.updatedAt.toISOString(),
        })),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erro ao listar missões admin:", error);

    return NextResponse.json(
      { message: "Não foi possível listar as missões agora." },
      { status: 500 },
    );
  }
}
