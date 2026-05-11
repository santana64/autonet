"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { BillingError, toActionError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { getStripeClient, getStripePriceId } from "@/lib/stripe";
import type { ActionState } from "@/actions/auth";

export async function createCheckoutAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  let redirectTo: string | null = null;
  try {
    const user = await requireUser();
    const plan = String(formData.get("plan") ?? "");
    if (!["STARTER", "PRO", "CABINET"].includes(plan)) throw new BillingError("Offre inconnue.");
    const stripe = getStripeClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const subscription = await prisma.subscription.upsert({
      where: { userId: user.id },
      create: { userId: user.id, plan: "FREE", status: "free" },
      update: {},
    });
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: subscription.stripeCustomerId ?? undefined,
      customer_email: subscription.stripeCustomerId ? undefined : user.email,
      line_items: [{ price: getStripePriceId(plan as "STARTER" | "PRO" | "CABINET"), quantity: 1 }],
      success_url: `${appUrl}/app/billing?success=1`,
      cancel_url: `${appUrl}/app/billing?cancelled=1`,
      metadata: { userId: user.id, plan },
      subscription_data: { metadata: { userId: user.id, plan } },
    });
    if (!session.url) throw new BillingError("Impossible de créer la session Stripe.");
    redirectTo = session.url;
  } catch (error) {
    return toActionError(error);
  }
  redirect(redirectTo ?? "/app/billing");
}

export async function createBillingPortalAction(): Promise<ActionState> {
  let redirectTo: string | null = null;
  try {
    const user = await requireUser();
    const subscription = await prisma.subscription.findUnique({ where: { userId: user.id } });
    if (!subscription?.stripeCustomerId) throw new BillingError("Aucun client Stripe associé à ce compte.");
    const stripe = getStripeClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${appUrl}/app/billing`,
    });
    redirectTo = session.url;
  } catch (error) {
    return toActionError(error);
  }
  redirect(redirectTo ?? "/app/billing");
}

export async function createCheckoutDirectAction(formData: FormData): Promise<void> {
  await createCheckoutAction({}, formData);
}

export async function createBillingPortalDirectAction(): Promise<void> {
  await createBillingPortalAction();
}
