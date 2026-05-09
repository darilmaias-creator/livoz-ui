import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      orderBy: {
        price: "asc",
      },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        description: true,
        limitsJson: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        plans: plans.map((plan) => ({
          ...plan,
          price: plan.price.toString(),
          createdAt: plan.createdAt.toISOString(),
          updatedAt: plan.updatedAt.toISOString(),
        })),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erro ao listar planos admin:", error);

    return NextResponse.json(
      { message: "Não foi possível listar os planos agora." },
      { status: 500 },
    );
  }
}
