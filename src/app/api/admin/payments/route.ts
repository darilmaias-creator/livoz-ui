import { PaymentStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

function normalizePaymentStatus(status: string | null) {
  if (!status) {
    return null;
  }

  const normalized = status.trim().toUpperCase();

  if (normalized in PaymentStatus) {
    return normalized as PaymentStatus;
  }

  return "INVALID";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = normalizePaymentStatus(searchParams.get("status"));

    if (status === "INVALID") {
      return NextResponse.json(
        { message: "Status de pagamento inválido." },
        { status: 400 },
      );
    }

    const payments = await prisma.payment.findMany({
      where: status ? { status } : undefined,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        child: {
          select: {
            name: true,
          },
        },
        plan: {
          select: {
            name: true,
          },
        },
        subscription: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        payments: payments.map((payment) => ({
          id: payment.id,
          provider: payment.provider,
          providerPaymentId: payment.providerPaymentId,
          providerStatus: payment.providerStatus,
          amount: payment.amount.toString(),
          discountPercentage: payment.discountPercentage,
          finalAmount: payment.finalAmount.toString(),
          checkoutUrl: payment.checkoutUrl,
          status: payment.status,
          createdAt: payment.createdAt.toISOString(),
          updatedAt: payment.updatedAt.toISOString(),
          user: payment.user,
          child: payment.child,
          plan: payment.plan,
          subscription: payment.subscription,
        })),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erro ao listar pagamentos admin:", error);

    return NextResponse.json(
      { message: "Não foi possível listar os pagamentos agora." },
      { status: 500 },
    );
  }
}
