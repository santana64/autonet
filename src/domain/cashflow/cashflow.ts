import { ActivityCategory } from "@/domain/activity";
import { getContributionRate, RulesConfiguration } from "@/domain/rules/default-rules";

export type CashflowProfile = {
  taxWithholdingEnabled: boolean;
  conservativeReserveBufferRate: number;
};

export type CashEntryInput = {
  grossAmountCents: number;
  activityCategory: ActivityCategory;
  status?: "COLLECTED" | "PENDING_INVOICE" | "EXCLUDED";
};

export type EntryCashBreakdown = {
  grossAmountCents: number;
  socialContributionEstimateCents: number;
  trainingContributionEstimateCents: number;
  taxWithholdingEstimateCents: number;
  conservativeBufferCents: number;
  recommendedReserveCents: number;
  estimatedAvailableCents: number;
};

export function calculateEntryCashBreakdown(
  entry: CashEntryInput,
  rules: RulesConfiguration,
  profile: CashflowProfile
): EntryCashBreakdown {
  if (entry.status && entry.status !== "COLLECTED") {
    return emptyBreakdown(entry.grossAmountCents);
  }

  const grossAmountCents = Math.max(0, entry.grossAmountCents);
  if (grossAmountCents === 0) return emptyBreakdown(0);

  const rate = getContributionRate(entry.activityCategory, rules.year);
  const socialContributionEstimateCents = Math.round(grossAmountCents * rate.socialContributionRate);
  const trainingContributionEstimateCents = Math.round(grossAmountCents * (rate.trainingContributionRate ?? 0));
  const taxWithholdingEstimateCents = profile.taxWithholdingEnabled
    ? Math.round(grossAmountCents * (rate.taxWithholdingRate ?? 0))
    : 0;
  const baseReserve =
    socialContributionEstimateCents + trainingContributionEstimateCents + taxWithholdingEstimateCents;
  const conservativeBufferCents = Math.round(baseReserve * Math.max(0, profile.conservativeReserveBufferRate));
  const recommendedReserveCents = baseReserve + conservativeBufferCents;

  return {
    grossAmountCents,
    socialContributionEstimateCents,
    trainingContributionEstimateCents,
    taxWithholdingEstimateCents,
    conservativeBufferCents,
    recommendedReserveCents,
    estimatedAvailableCents: Math.max(0, grossAmountCents - recommendedReserveCents),
  };
}

export function calculatePeriodCashBreakdown(
  entries: CashEntryInput[],
  rules: RulesConfiguration,
  profile: CashflowProfile
) {
  const lines = entries.map((entry) => calculateEntryCashBreakdown(entry, rules, profile));
  return sumBreakdowns(lines);
}

export function calculateMonthlyAvailableMoney(
  entries: CashEntryInput[],
  rules: RulesConfiguration,
  profile: CashflowProfile
) {
  return calculatePeriodCashBreakdown(entries, rules, profile).estimatedAvailableCents;
}

export function calculateSafeAvailableMoney(context: {
  bankBalanceCents: number | null | undefined;
  targetReserveCents: number;
  manuallyReservedCents: number;
}) {
  const bankBalanceCents = context.bankBalanceCents ?? 0;
  const missingReserveCents = Math.max(0, context.targetReserveCents - context.manuallyReservedCents);
  return Math.max(0, bankBalanceCents - missingReserveCents);
}

export function calculateReserveHealth(targetReserveCents: number, actualReservedCents: number) {
  const deltaCents = actualReservedCents - targetReserveCents;
  if (Math.abs(deltaCents) <= Math.max(100, Math.round(targetReserveCents * 0.03))) {
    return { status: "ENOUGH" as const, deltaCents, label: "Réserve suffisante" };
  }
  if (deltaCents < 0) {
    return { status: "MISSING" as const, deltaCents, label: "Réserve insuffisante" };
  }
  return { status: "OVER_RESERVED" as const, deltaCents, label: "Sur-réservé" };
}

function sumBreakdowns(lines: EntryCashBreakdown[]): EntryCashBreakdown {
  return lines.reduce(
    (sum, line) => ({
      grossAmountCents: sum.grossAmountCents + line.grossAmountCents,
      socialContributionEstimateCents:
        sum.socialContributionEstimateCents + line.socialContributionEstimateCents,
      trainingContributionEstimateCents:
        sum.trainingContributionEstimateCents + line.trainingContributionEstimateCents,
      taxWithholdingEstimateCents: sum.taxWithholdingEstimateCents + line.taxWithholdingEstimateCents,
      conservativeBufferCents: sum.conservativeBufferCents + line.conservativeBufferCents,
      recommendedReserveCents: sum.recommendedReserveCents + line.recommendedReserveCents,
      estimatedAvailableCents: sum.estimatedAvailableCents + line.estimatedAvailableCents,
    }),
    emptyBreakdown(0)
  );
}

function emptyBreakdown(grossAmountCents: number): EntryCashBreakdown {
  return {
    grossAmountCents: Math.max(0, grossAmountCents),
    socialContributionEstimateCents: 0,
    trainingContributionEstimateCents: 0,
    taxWithholdingEstimateCents: 0,
    conservativeBufferCents: 0,
    recommendedReserveCents: 0,
    estimatedAvailableCents: Math.max(0, grossAmountCents),
  };
}
