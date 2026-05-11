export type Plan = "FREE" | "STARTER" | "PRO" | "CABINET";

export type PlanLimitKey =
  | "revenueEntriesPerMonth"
  | "clients"
  | "documentExport"
  | "advancedSimulator"
  | "advancedReserveTracking"
  | "csvExport"
  | "accountantExport";

export const PLAN_LIMITS: Record<
  Plan,
  {
    label: string;
    priceMonthly: number;
    revenueEntriesPerMonth: number | null;
    clients: number | null;
    documentExport: boolean;
    advancedSimulator: boolean;
    advancedReserveTracking: boolean;
    csvExport: boolean;
    accountantExport: boolean;
  }
> = {
  FREE: {
    label: "Free",
    priceMonthly: 0,
    revenueEntriesPerMonth: 5,
    clients: 1,
    documentExport: false,
    advancedSimulator: false,
    advancedReserveTracking: false,
    csvExport: false,
    accountantExport: false,
  },
  STARTER: {
    label: "Solo",
    priceMonthly: 9,
    revenueEntriesPerMonth: null,
    clients: 20,
    documentExport: true,
    advancedSimulator: false,
    advancedReserveTracking: false,
    csvExport: false,
    accountantExport: false,
  },
  PRO: {
    label: "Pro",
    priceMonthly: 19,
    revenueEntriesPerMonth: null,
    clients: null,
    documentExport: true,
    advancedSimulator: true,
    advancedReserveTracking: true,
    csvExport: true,
    accountantExport: true,
  },
  CABINET: {
    label: "Cabinet",
    priceMonthly: 29,
    revenueEntriesPerMonth: null,
    clients: null,
    documentExport: true,
    advancedSimulator: true,
    advancedReserveTracking: true,
    csvExport: true,
    accountantExport: true,
  },
};

export function planAllows(plan: Plan, feature: PlanLimitKey) {
  const limits = PLAN_LIMITS[plan];
  const value = limits[feature];
  return typeof value === "boolean" ? value : value === null || value > 0;
}

export function assertPlanAllows(plan: Plan, feature: PlanLimitKey) {
  if (!planAllows(plan, feature)) {
    throw new Error("Votre offre actuelle ne permet pas cette action.");
  }
}

export function isWithinPlanLimit(plan: Plan, key: "revenueEntriesPerMonth" | "clients", currentCount: number) {
  const limit = PLAN_LIMITS[plan][key];
  return limit === null || currentCount < limit;
}
