import { prisma } from "@/lib/prisma";
import { PrivacyRequestStatus, PrivacyRequestType } from "@prisma/client";
import { NextResponse } from "next/server";

type PrivacyRequestBody = {
  userId?: string;
  childId?: string | null;
  type?: string;
  message?: string | null;
};

const allowedTypes = new Set<string>([
  PrivacyRequestType.DATA_CORRECTION,
  PrivacyRequestType.ACCOUNT_DELETION,
  PrivacyRequestType.CHILD_DATA_DELETION,
]);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PrivacyRequestBody;
    const userId = body.userId?.trim();
    const childId = body.childId?.trim() || null;
    const type = body.type?.trim().toUpperCase();
    const message = body.message?.trim() || null;

    if (!userId) {
      return NextResponse.json(
        { message: "Informe o responsável para registrar a solicitação." },
        { status: 400 },
      );
    }

    if (!type || !allowedTypes.has(type)) {
      return NextResponse.json(
        { message: "Tipo de solicitação de privacidade inválido." },
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

    if (type === PrivacyRequestType.CHILD_DATA_DELETION && !childId) {
      return NextResponse.json(
        { message: "Informe a criança para solicitar a exclusão dos dados infantis." },
        { status: 400 },
      );
    }

    if (childId) {
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
    }

    const privacyRequest = await prisma.privacyRequest.create({
      data: {
        userId,
        childId,
        type: type as PrivacyRequestType,
        status: PrivacyRequestStatus.PENDING,
        message,
      },
      select: {
        id: true,
        userId: true,
        childId: true,
        type: true,
        status: true,
        message: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        privacyRequest: {
          ...privacyRequest,
          createdAt: privacyRequest.createdAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Erro ao registrar solicitação de privacidade:", error);

    return NextResponse.json(
      { message: "Não foi possível registrar a solicitação agora." },
      { status: 500 },
    );
  }
}
