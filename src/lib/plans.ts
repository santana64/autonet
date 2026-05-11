import { startOfMonth } from "date-fns";
import { Plan, isWithinPlanLimit, planAllows } from "@/domain/billing/plans";
import { BillingError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

export async function getUserPlan(userId: string): Promise<Plan> {
  const subscription = await prisma.subscription.findUnique({ where: { userId } });
  return (subscription?.plan ?? "FREE") as Plan;
}

export async function enforceRevenueEntryLimit(userId: string) {
  const plan = await getUserPlan(userId);
  const count = await prisma.revenueEntry.count({
    where: { userId, createdAt: { gte: startOfMonth(new Date()) } },
  });
  if (!isWithinPlanLimit(plan, "revenueEntriesPerMonth", count)) {
    throw new BillingError("Votre offre actuelle ne permet pas cette action.");
  }
}

export async function enforceClientLimit(userId: string) {
  const plan = await getUserPlan(userId);
  const count = await prisma.client.count({ where: { userId } });
  if (!isWithinPlanLimit(plan, "clients", count)) {
    throw new BillingError("Votre offre actuelle ne permet pas cette action.");
  }
}

export async function enforceFeature(
  userId: string,
  feature: "documentExport" | "advancedSimulator" | "advancedReserveTracking" | "csvExport" | "accountantExport"
) {
  const plan = await getUserPlan(userId);
  if (!planAllows(plan, feature)) {
    throw new BillingError("Votre offre actuelle ne permet pas cette action.");
  }
}
