import { ActivityCategory } from "@/domain/activity";
import {
  calculateEntryCashBreakdown,
  calculateReserveHealth,
  CashflowProfile,
} from "@/domain/cashflow/cashflow";
import { RulesConfiguration } from "@/domain/rules/default-rules";
import { addDays } from "date-fns";

export type DecisionSignal = "GREEN" | "ORANGE" | "RED";

export function simulateAvailableFromGross(input: {
  grossAmountCents: number;
  activityCategory: ActivityCategory;
  taxWithholdingEnabled: boolean;
  conservativeReserveBufferRate: number;
  rules: RulesConfiguration;
}) {
  return calculateEntryCashBreakdown(
    { grossAmountCents: input.grossAmountCents, activityCategory: input.activityCategory, status: "COLLECTED" },
    input.rules,
    {
      taxWithholdingEnabled: input.taxWithholdingEnabled,
      conservativeReserveBufferRate: input.conservativeReserveBufferRate,
    }
  );
}

export function simulateGrossNeededForTargetNet(input: {
  targetAvailableCents: number;
  activityCategory: ActivityCategory;
  profile: CashflowProfile;
  rules: RulesConfiguration;
}) {
  let low = input.targetAvailableCents;
  let high = Math.max(input.targetAvailableCents * 3, input.targetAvailableCents + 100_00);

  for (let i = 0; i < 48; i += 1) {
    const middle = Math.floor((low + high) / 2);
    const breakdown = calculateEntryCashBreakdown(
      { grossAmountCents: middle, activityCategory: input.activityCategory, status: "COLLECTED" },
      input.rules,
      input.profile
    );
    if (breakdown.estimatedAvailableCents >= input.targetAvailableCents) {
      high = middle;
    } else {
      low = middle + 1;
    }
  }

  const breakdown = calculateEntryCashBreakdown(
    { grossAmountCents: high, activityCategory: input.activityCategory, status: "COLLECTED" },
    input.rules,
    input.profile
  );

  return {
    grossRevenueNeededCents: high,
    ...breakdown,
  };
}

export function simulateCanSpend(input: {
  desiredSpendCents: number;
  bankBalanceCents: number;
  currentReservedCents: number;
  upcomingEstimatedDueCents: number;
}) {
  const health = calculateReserveHealth(input.upcomingEstimatedDueCents, input.currentReservedCents);
  const safeAvailableCents = Math.max(
    0,
    input.bankBalanceCents - Math.max(0, input.upcomingEstimatedDueCents - input.currentReservedCents)
  );

  if (input.desiredSpendCents <= safeAvailableCents * 0.8 && health.status !== "MISSING") {
    return {
      decision: "SAFE" as const,
      safeAvailableCents,
      explanation: "Dépense compatible avec votre réserve estimée.",
      reserveHealth: health,
    };
  }
  if (input.desiredSpendCents <= safeAvailableCents) {
    return {
      decision: "CAUTION" as const,
      safeAvailableCents,
      explanation: "Possible, mais gardez une marge car les montants restent des estimations.",
      reserveHealth: health,
    };
  }
  return {
    decision: "NO" as const,
    safeAvailableCents,
    explanation: "Dépense déconseillée : elle entame la réserve à provisionner.",
    reserveHealth: health,
  };
}

export function calculateSalaryTarget(input: {
  targetAvailableCents: number;
  currentAvailableCents: number;
  monthCollectedCents: number;
  activityCategory: ActivityCategory;
  profile: CashflowProfile;
  rules: RulesConfiguration;
}) {
  const targetAvailableCents = Math.max(0, input.targetAvailableCents);
  const target = simulateGrossNeededForTargetNet({
    targetAvailableCents,
    activityCategory: input.activityCategory,
    profile: input.profile,
    rules: input.rules,
  });
  const grossRevenueNeededCents = target.grossRevenueNeededCents;
  const remainingRevenueCents = Math.max(0, grossRevenueNeededCents - Math.max(0, input.monthCollectedCents));
  const progressPercent =
    grossRevenueNeededCents > 0 ? Math.min(100, (Math.max(0, input.monthCollectedCents) / grossRevenueNeededCents) * 100) : 100;
  const safePayableCents = Math.min(targetAvailableCents, Math.max(0, input.currentAvailableCents));
  const safetyMarginCents = Math.max(0, Math.max(0, input.currentAvailableCents) - targetAvailableCents);
  const signal: DecisionSignal =
    input.currentAvailableCents >= targetAvailableCents ? "GREEN" : progressPercent >= 70 ? "ORANGE" : "RED";

  return {
    targetAvailableCents,
    grossRevenueNeededCents,
    recommendedReserveCents: target.recommendedReserveCents,
    remainingRevenueCents,
    progressPercent,
    safePayableCents,
    safetyMarginCents,
    signal,
  };
}

export function evaluateSpendDecision(input: {
  desiredSpendCents: number;
  safeAvailableCents: number;
  activityCategory: ActivityCategory;
  profile: CashflowProfile;
  rules: RulesConfiguration;
  dailyRevenuePaceCents?: number;
  currentDate?: Date;
}) {
  const desiredSpendCents = Math.max(0, input.desiredSpendCents);
  const safeAvailableCents = Math.max(0, input.safeAvailableCents);
  const marginAfterSpendCents = safeAvailableCents - desiredSpendCents;
  const additionalAvailableNeededCents = Math.max(0, desiredSpendCents - safeAvailableCents);
  const additionalGrossRevenueNeededCents =
    additionalAvailableNeededCents > 0
      ? simulateGrossNeededForTargetNet({
          targetAvailableCents: additionalAvailableNeededCents,
          activityCategory: input.activityCategory,
          profile: input.profile,
          rules: input.rules,
        }).grossRevenueNeededCents
      : 0;
  const dailyRevenuePaceCents = Math.max(0, input.dailyRevenuePaceCents ?? 0);
  const daysUntilSafe =
    additionalGrossRevenueNeededCents > 0 && dailyRevenuePaceCents > 0
      ? Math.ceil(additionalGrossRevenueNeededCents / dailyRevenuePaceCents)
      : null;
  const availableFromDate =
    daysUntilSafe && daysUntilSafe > 0 ? addDays(input.currentDate ?? new Date(), daysUntilSafe) : null;

  let signal: DecisionSignal = "RED";
  let decision = "Non recommandé";
  let explanation = "Cette dépense dépasse ton disponible prudent et entame l'argent à réserver.";

  if (desiredSpendCents <= Math.round(safeAvailableCents * 0.75)) {
    signal = "GREEN";
    decision = "Feu vert";
    explanation = "Cette dépense laisse une marge de sécurité confortable après réserve.";
  } else if (desiredSpendCents <= safeAvailableCents) {
    signal = "ORANGE";
    decision = "Possible, mais prudent";
    explanation = "Tu peux le faire, mais la marge restante devient plus fine.";
  }

  return {
    signal,
    decision,
    explanation,
    desiredSpendCents,
    safeAvailableCents,
    marginAfterSpendCents,
    additionalAvailableNeededCents,
    additionalGrossRevenueNeededCents,
    daysUntilSafe,
    availableFromDate,
  };
}

export function calculateMinimumPricing(input: {
  targetAvailableCents: number;
  billableDays: number;
  averageSaleCents?: number;
  activityCategory: ActivityCategory;
  profile: CashflowProfile;
  rules: RulesConfiguration;
}) {
  const billableDays = Math.max(1, Math.floor(input.billableDays));
  const target = simulateGrossNeededForTargetNet({
    targetAvailableCents: Math.max(0, input.targetAvailableCents),
    activityCategory: input.activityCategory,
    profile: input.profile,
    rules: input.rules,
  });
  const minimumDailyRateCents = Math.ceil(target.grossRevenueNeededCents / billableDays);
  const prudentDailyRateCents = roundUpToIncrement(Math.round(minimumDailyRateCents * 1.35), 10_00);
  const ambitiousDailyRateCents = roundUpToIncrement(Math.round(minimumDailyRateCents * 1.7), 10_00);
  const salesNeeded =
    input.averageSaleCents && input.averageSaleCents > 0
      ? Math.ceil(target.grossRevenueNeededCents / input.averageSaleCents)
      : null;

  return {
    targetAvailableCents: Math.max(0, input.targetAvailableCents),
    grossRevenueNeededCents: target.grossRevenueNeededCents,
    recommendedReserveCents: target.recommendedReserveCents,
    billableDays,
    minimumDailyRateCents,
    prudentDailyRateCents,
    ambitiousDailyRateCents,
    salesNeeded,
  };
}

export function calculateRunwayStressTest(input: {
  safeAvailableCents: number;
  currentReserveCents: number;
  monthlyPersonalNeedCents: number;
  fixedMonthlyCostsCents?: number;
}) {
  const monthlyBurnCents = Math.max(
    1,
    Math.max(0, input.monthlyPersonalNeedCents) + Math.max(0, input.fixedMonthlyCostsCents ?? 0)
  );
  const totalCushionCents = Math.max(0, input.safeAvailableCents) + Math.max(0, input.currentReserveCents);
  const runwayDays = Math.floor((totalCushionCents / monthlyBurnCents) * 30);
  const balanceAfter30DaysCents = totalCushionCents - monthlyBurnCents;
  const balanceAfter60DaysCents = totalCushionCents - monthlyBurnCents * 2;
  const recommendedReserveCents = monthlyBurnCents * 3;
  const missingReserveCents = Math.max(0, recommendedReserveCents - Math.max(0, input.currentReserveCents));
  const signal: DecisionSignal =
    runwayDays >= 90 ? "GREEN" : runwayDays >= 45 ? "ORANGE" : "RED";

  return {
    monthlyBurnCents,
    totalCushionCents,
    runwayDays,
    balanceAfter30DaysCents,
    balanceAfter60DaysCents,
    recommendedReserveCents,
    missingReserveCents,
    signal,
  };
}

export function scenarioForecast(input: {
  expectedRevenueCents: number;
  activityCategory: ActivityCategory;
  profile: CashflowProfile;
  rules: RulesConfiguration;
}) {
  return simulateAvailableFromGross({
    grossAmountCents: input.expectedRevenueCents,
    activityCategory: input.activityCategory,
    taxWithholdingEnabled: input.profile.taxWithholdingEnabled,
    conservativeReserveBufferRate: input.profile.conservativeReserveBufferRate,
    rules: input.rules,
  });
}

function roundUpToIncrement(cents: number, incrementCents: number) {
  return Math.ceil(Math.max(0, cents) / incrementCents) * incrementCents;
}
