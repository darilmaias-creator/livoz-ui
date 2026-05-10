import { prisma } from "@/lib/prisma";
import { PrivacyRequestStatus } from "@prisma/client";
import { NextResponse } from "next/server";

const allowedStatuses = new Set<string>(Object.values(PrivacyRequestStatus));

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status")?.trim().toUpperCase();

    if (status && !allowedStatuses.has(status)) {
      return NextResponse.json(
        { message: "Status de solicitação inválido." },
        { status: 400 },
      );
    }

    const privacyRequests = await prisma.privacyRequest.findMany({
      where: status ? { status: status as PrivacyRequestStatus } : undefined,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        type: true,
        status: true,
        message: true,
        createdAt: true,
        reviewedAt: true,
        adminNotes: true,
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
    });

    return NextResponse.json(
      {
        privacyRequests: privacyRequests.map((item) => ({
          id: item.id,
          type: item.type,
          status: item.status,
          message: item.message,
          createdAt: item.createdAt.toISOString(),
          reviewedAt: item.reviewedAt?.toISOString() ?? null,
          adminNotes: item.adminNotes,
          user: item.user,
          child: item.child,
        })),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erro ao listar solicitações de privacidade:", error);

    return NextResponse.json(
      { message: "Não foi possível listar as solicitações de privacidade agora." },
      { status: 500 },
    );
  }
}
