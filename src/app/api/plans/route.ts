import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      where: {
        active: true,
      },
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
      },
    });

    return NextResponse.json({ plans }, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar planos:", error);

    return NextResponse.json(
      { message: "Nao foi possivel buscar os planos agora." },
      { status: 500 },
    );
  }
}
