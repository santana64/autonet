import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripeClient } from "@/lib/stripe";

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return Response.json({ error: "Stripe n'est pas configuré en local." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return Response.json({ error: "Signature Stripe manquante." }, { status: 400 });

  let event: Stripe.Event;
  try {
    const stripe = getStripeClient();
    const body = await request.text();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return Response.json({ error: "Signature Stripe invalide." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const plan = parsePlan(session.metadata?.plan);
    if (userId && plan) {
      await prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          plan,
          status: "active",
          stripeCustomerId: String(session.customer ?? ""),
          stripeSubscriptionId: String(session.subscription ?? ""),
        },
        update: {
          plan,
          status: "active",
          stripeCustomerId: String(session.customer ?? ""),
          stripeSubscriptionId: String(session.subscription ?? ""),
        },
      });
    }
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.created") {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = subscription.metadata?.userId;
    const plan = parsePlan(subscription.metadata?.plan) ?? inferPlanFromPrice(subscription.items.data[0]?.price.id);
    const currentPeriodEnd = subscription.items.data[0]?.current_period_end;
    if (userId && plan) {
      await prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          plan,
          status: subscription.status,
          stripeCustomerId: String(subscription.customer),
          stripeSubscriptionId: subscription.id,
          currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : null,
        },
        update: {
          plan,
          status: subscription.status,
          stripeCustomerId: String(subscription.customer),
          stripeSubscriptionId: subscription.id,
          currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : null,
        },
      });
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: { plan: "FREE", status: subscription.status, currentPeriodEnd: null },
    });
  }

  return Response.json({ received: true });
}

function parsePlan(value: string | null | undefined) {
  if (value === "STARTER" || value === "PRO" || value === "CABINET") return value;
  return null;
}

function inferPlanFromPrice(priceId: string | undefined) {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_STARTER) return "STARTER";
  if (priceId === process.env.STRIPE_PRICE_PRO) return "PRO";
  if (priceId === process.env.STRIPE_PRICE_CABINET) return "CABINET";
  return null;
}
