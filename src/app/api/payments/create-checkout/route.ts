import { BenefitType, PaymentStatus, SubscriptionStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { calculateFinalPrice } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";
import { getAppUrl, getStripe } from "@/lib/stripe";

type CheckoutBody = {
  userId?: string;
  childId?: string;
  planId?: string;
};

function decimalToNumber(value: unknown) {
  if (typeof value === "number") {
    return value;
  }

  if (value && typeof value === "object" && "toNumber" in value) {
    return (value as { toNumber: () => number }).toNumber();
  }

  return Number(value);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CheckoutBody;
    const { userId, childId, planId } = body;

    if (!userId || !childId || !planId) {
      return NextResponse.json(
        { message: "Informe responsavel, crianca e plano para continuar." },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Responsavel nao encontrado." },
        { status: 404 },
      );
    }

    const child = await prisma.child.findFirst({
      where: {
        id: childId,
        userId,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!child) {
      return NextResponse.json(
        { message: "Crianca nao encontrada para este responsavel." },
        { status: 404 },
      );
    }

    const plan = await prisma.plan.findUnique({
      where: { id: planId },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        active: true,
      },
    });

    if (!plan || !plan.active) {
      return NextResponse.json(
        { message: "Plano nao encontrado ou indisponivel." },
        { status: 404 },
      );
    }

    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        childId,
        userId,
        status: SubscriptionStatus.ACTIVE,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!activeSubscription) {
      return NextResponse.json(
        { message: "Assinatura ativa nao encontrada para esta crianca." },
        { status: 404 },
      );
    }

    const basePrice = decimalToNumber(plan.price);
    const discountPercentage = activeSubscription.discountPercentage;
    const finalPrice = calculateFinalPrice(basePrice, discountPercentage);

    if (plan.slug === "modo-gratuito") {
      await prisma.subscription.update({
        where: { id: activeSubscription.id },
        data: {
          planId: plan.id,
          status: SubscriptionStatus.ACTIVE,
          benefitType: BenefitType.MODO_GRATUITO,
          discountPercentage: 0,
          endsAt: null,
        },
      });

      return NextResponse.json(
        {
          freeAccess: true,
          message: "Modo Gratuito ativado com sucesso.",
        },
        { status: 200 },
      );
    }

    if (finalPrice === 0) {
      await prisma.subscription.update({
        where: { id: activeSubscription.id },
        data: {
          planId: plan.id,
          status: SubscriptionStatus.ACTIVE,
          benefitType: activeSubscription.benefitType,
          discountPercentage,
          endsAt: activeSubscription.endsAt,
        },
      });

      return NextResponse.json(
        {
          freeAccess: true,
          message: "Plano liberado pelo beneficio ativo.",
        },
        { status: 200 },
      );
    }

    const stripe = getStripe();
    const appUrl = getAppUrl();
    const unitAmount = Math.round(finalPrice * 100);
    const payment = await prisma.payment.create({
      data: {
        userId,
        childId,
        planId: plan.id,
        subscriptionId: activeSubscription.id,
        provider: "stripe",
        amount: basePrice,
        discountPercentage,
        finalAmount: finalPrice,
        status: PaymentStatus.PENDING,
        metadata: {
          userId,
          childId,
          planId: plan.id,
          subscriptionId: activeSubscription.id,
        },
      },
    });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: user.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "brl",
            unit_amount: unitAmount,
            recurring: {
              interval: "month",
            },
            product_data: {
              name: plan.name,
            },
          },
        },
      ],
      success_url: `${appUrl}/pagamento/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pagamento/falha`,
      metadata: {
        paymentId: payment.id,
        userId,
        childId,
        planId: plan.id,
        subscriptionId: activeSubscription.id,
        discountPercentage: String(discountPercentage),
        finalPrice: String(finalPrice),
      },
      subscription_data: {
        metadata: {
          paymentId: payment.id,
          userId,
          childId,
          planId: plan.id,
          subscriptionId: activeSubscription.id,
          discountPercentage: String(discountPercentage),
          finalPrice: String(finalPrice),
        },
      },
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        checkoutUrl: session.url,
        metadata: {
          userId,
          childId,
          planId: plan.id,
          subscriptionId: activeSubscription.id,
          sessionId: session.id,
        },
      },
    });

    return NextResponse.json(
      {
        checkoutUrl: session.url,
        finalPrice,
        discountPercentage,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erro ao criar checkout Stripe:", error);

    return NextResponse.json(
      { message: "Nao foi possivel iniciar o pagamento agora." },
      { status: 500 },
    );
  }
}
