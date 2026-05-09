import { PaymentStatus, SubscriptionStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { prisma } from "@/lib/prisma";
import { getStripe, getStripeWebhookSecret } from "@/lib/stripe";

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function getStripeObjectId(value: string | { id: string } | null) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  return value.id;
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const metadata = session.metadata || {};
  const paymentId = metadata.paymentId;
  const userId = metadata.userId;
  const childId = metadata.childId;
  const planId = metadata.planId;
  const subscriptionId = metadata.subscriptionId;
  const discountPercentage = Number(metadata.discountPercentage || 0);
  const finalPrice = Number(metadata.finalPrice || 0);
  const stripeCustomerId = getStripeObjectId(session.customer);
  const stripeSubscriptionId = getStripeObjectId(session.subscription);

  if (!userId || !childId || !planId || !subscriptionId) {
    throw new Error("Metadata obrigatoria ausente no checkout.session.completed.");
  }

  console.log("Checkout Stripe confirmado:", {
    paymentId,
    userId,
    childId,
    planId,
    subscriptionId,
    discountPercentage,
    finalPrice,
    stripeCustomerId,
    stripeSubscriptionId,
  });

  const now = new Date();

  if (paymentId) {
    await prisma.payment.updateMany({
      where: {
        id: paymentId,
        userId,
        childId,
      },
      data: {
        providerPaymentId: session.id,
        providerStatus: session.payment_status || session.status || "completed",
        status: PaymentStatus.APPROVED,
        metadata: {
          ...metadata,
          sessionId: session.id,
          stripeCustomerId,
          stripeSubscriptionId,
          paymentStatus: session.payment_status,
          checkoutStatus: session.status,
        },
      },
    });
  }

  const updatedSubscription = await prisma.subscription.updateMany({
    where: {
      id: subscriptionId,
      userId,
      childId,
    },
    data: {
      planId,
      status: SubscriptionStatus.ACTIVE,
      discountPercentage: Number.isFinite(discountPercentage) ? discountPercentage : 0,
      stripeCustomerId: stripeCustomerId || undefined,
      stripeSubscriptionId: stripeSubscriptionId || undefined,
      startsAt: now,
      endsAt: addDays(now, 30),
    },
  });

  if (updatedSubscription.count === 0) {
    throw new Error("Assinatura nao encontrada para liberar o plano pago.");
  }
}

async function handleCheckoutSessionNotApproved(
  session: Stripe.Checkout.Session,
  status: PaymentStatus,
) {
  const metadata = session.metadata || {};
  const paymentId = metadata.paymentId;

  if (!paymentId) {
    console.log("Evento Stripe sem paymentId para atualizar Payment:", session.id);
    return;
  }

  await prisma.payment.updateMany({
    where: {
      id: paymentId,
    },
    data: {
      providerPaymentId: session.id,
      providerStatus: session.payment_status || session.status || status,
      status,
      metadata: {
        ...metadata,
        sessionId: session.id,
        paymentStatus: session.payment_status,
        checkoutStatus: session.status,
      },
    },
  });
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = getStripeWebhookSecret();

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET nao configurado.");

    return NextResponse.json(
      { message: "Webhook da Stripe nao configurado." },
      { status: 500 },
    );
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { message: "Assinatura da Stripe ausente." },
      { status: 400 },
    );
  }

  let event: Stripe.Event;

  try {
    const rawBody = await request.text();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error("Erro ao validar webhook Stripe:", error);

    return NextResponse.json(
      { message: "Webhook Stripe invalido." },
      { status: 400 },
    );
  }

  try {
    if (event.type === "checkout.session.completed") {
      await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
    }

    if (event.type === "checkout.session.expired") {
      await handleCheckoutSessionNotApproved(
        event.data.object as Stripe.Checkout.Session,
        PaymentStatus.CANCELED,
      );
    }

    if (event.type === "checkout.session.async_payment_failed") {
      await handleCheckoutSessionNotApproved(
        event.data.object as Stripe.Checkout.Session,
        PaymentStatus.REJECTED,
      );
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Erro ao processar webhook Stripe:", error);

    return NextResponse.json(
      { message: "Nao foi possivel processar o webhook Stripe." },
      { status: 500 },
    );
  }
}
