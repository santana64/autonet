import Stripe from "stripe";
import { BillingError } from "@/lib/errors";

export function getStripeClient() {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new BillingError("Stripe n'est pas configuré en local.");
  return new Stripe(secret);
}

export function getStripePriceId(plan: "STARTER" | "PRO" | "CABINET") {
  const envKey = `STRIPE_PRICE_${plan}` as const;
  const price = process.env[envKey];
  if (!price) throw new BillingError("Stripe n'est pas configuré en local.");
  return price;
}
