import { subMonths } from "date-fns";
import { ActivityCategory } from "@/domain/activity";
import { estimateTotalDue, RevenueByActivity } from "@/domain/contributions/contributions";
import { RevenueLike, groupRevenueByActivity } from "@/domain/revenue/revenue";
import { RulesConfiguration } from "@/domain/rules/default-rules";

export function forecastRevenue(entries: RevenueLike[], monthsAhead: number, fromDate = new Date()) {
  const recentStart = subMonths(fromDate, 6);
  const recentEntries = entries.filter(
    (entry) => entry.status === "COLLECTED" && new Date(entry.collectionDate) >= recentStart
  );
  const byActivity = groupRevenueByActivity(recentEntries);
  const monthlyAverageByActivity = Object.fromEntries(
    Object.entries(byActivity).map(([category, cents]) => [category, Math.round(cents / 6)])
  ) as Partial<Record<ActivityCategory, number>>;

  const projectedRevenueByActivity = Object.fromEntries(
    Object.entries(monthlyAverageByActivity).map(([category, cents]) => [category, Math.round((cents ?? 0) * monthsAhead)])
  ) as Partial<Record<ActivityCategory, number>>;

  return {
    monthsAhead,
    monthlyAverageByActivity,
    projectedRevenueByActivity,
    projectedRevenueCents: Object.values(projectedRevenueByActivity).reduce((sum, cents) => sum + (cents ?? 0), 0),
  };
}

export function forecastContributions(
  projectedRevenue: RevenueByActivity,
  rules: RulesConfiguration,
  options: { taxWithholdingEnabled: boolean }
) {
  return estimateTotalDue(projectedRevenue, rules, options);
}

export function calculateReserveRecommendation(projectedDueCents: number, reserveRate: number | null | undefined) {
  const rate = reserveRate && reserveRate > 0 ? reserveRate : 0.3;
  return Math.max(projectedDueCents, Math.round(projectedDueCents * (1 + rate)));
}

export function scenarioForecast(input: {
  expectedRevenueCents: number;
  expensesCents?: number;
  contributionProvisionRate: number;
  targetNetIncomeCents?: number;
}) {
  const contributionProvisionCents = Math.round(input.expectedRevenueCents * input.contributionProvisionRate);
  const expensesCents = input.expensesCents ?? 0;
  const netAvailableCents = Math.max(0, input.expectedRevenueCents - contributionProvisionCents - expensesCents);
  const targetGapCents = input.targetNetIncomeCents ? netAvailableCents - input.targetNetIncomeCents : null;

  return {
    contributionProvisionCents,
    expensesCents,
    netAvailableCents,
    targetGapCents,
    reserveRateUsed: input.contributionProvisionRate,
  };
}
