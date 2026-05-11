import { describe, expect, it } from "vitest";
import { isExpired, isTokenUsable, hashToken } from "../../src/domain/auth/tokens";
import { PLAN_LIMITS, isWithinPlanLimit, planAllows } from "../../src/domain/billing/plans";
import {
  calculateEntryCashBreakdown,
  calculatePeriodCashBreakdown,
  calculateReserveHealth,
  calculateSafeAvailableMoney,
} from "../../src/domain/cashflow/cashflow";
import { estimateNetAvailable, estimateTotalDue } from "../../src/domain/contributions/contributions";
import { calculateDeclarationSnapshot, generateDeclarationPeriods } from "../../src/domain/declarations/declarations";
import { generateDeclarationSummary, generateMonthlyCashSummary, generateThresholdReport } from "../../src/domain/documents/documents";
import { formatMoney } from "../../src/domain/formatting/format";
import { applyReserveEvent, calculateMissingReserve, calculateTargetReserve, getReserveRecommendation } from "../../src/domain/reserve/reserve";
import {
  assignRevenueToDeclarationPeriod,
  calculateCollectedRevenue,
  excludePendingOrExcludedEntries,
  groupRevenueByActivity,
} from "../../src/domain/revenue/revenue";
import { getContributionRate, getRulesForYear, getThresholdRule, validateRulesConfiguration } from "../../src/domain/rules/default-rules";
import {
  calculateMinimumPricing,
  calculateRunwayStressTest,
  calculateSalaryTarget,
  evaluateSpendDecision,
  simulateAvailableFromGross,
  simulateCanSpend,
  simulateGrossNeededForTargetNet,
} from "../../src/domain/simulator/simulator";
import {
  evaluateMicroThresholdUsage,
  evaluateMixedActivityThresholds,
  getThresholdRiskLevel,
  projectAnnualRevenue,
} from "../../src/domain/thresholds/thresholds";

const rules = getRulesForYear(2026);
const cashProfile = { taxWithholdingEnabled: true, conservativeReserveBufferRate: 0.05 };
const entries = [
  {
    activityCategory: "SERVICE_BNC" as const,
    collectionDate: new Date(2026, 0, 15),
    grossAmountCents: 10_000_00,
    status: "COLLECTED" as const,
  },
  {
    activityCategory: "SERVICE_BIC" as const,
    collectionDate: new Date(2026, 1, 15),
    grossAmountCents: 5_000_00,
    status: "COLLECTED" as const,
  },
  {
    activityCategory: "SERVICE_BNC" as const,
    collectionDate: new Date(2026, 1, 20),
    grossAmountCents: 2_000_00,
    status: "PENDING_INVOICE" as const,
  },
];

describe("rules", () => {
  it("retrieves 2026 thresholds", () => {
    expect(getThresholdRule("GOODS_SALES", 2026).microThresholdCents).toBe(203_100_00);
    expect(getThresholdRule("SERVICE_BNC", 2026).microThresholdCents).toBe(83_600_00);
  });

  it("retrieves contribution rates", () => {
    expect(getContributionRate("SERVICE_BIC", 2026).socialContributionRate).toBe(0.212);
    expect(getContributionRate("LIBERAL_GENERAL", 2026).taxWithholdingRate).toBe(0.022);
  });

  it("detects invalid rule configuration", () => {
    const invalid = validateRulesConfiguration({ ...rules, contributionRates: [] });
    expect(invalid.valid).toBe(false);
    expect(invalid.errors.length).toBeGreaterThan(1);
  });
});

describe("cashflow", () => {
  it("calculates entry breakdown from gross revenue", () => {
    const breakdown = calculateEntryCashBreakdown(
      { grossAmountCents: 3_000_00, activityCategory: "SERVICE_BNC", status: "COLLECTED" },
      rules,
      cashProfile
    );

    expect(breakdown.socialContributionEstimateCents).toBe(768_00);
    expect(breakdown.trainingContributionEstimateCents).toBe(6_00);
    expect(breakdown.taxWithholdingEstimateCents).toBe(66_00);
    expect(breakdown.recommendedReserveCents).toBe(882_00);
    expect(breakdown.estimatedAvailableCents).toBe(2_118_00);
  });

  it("calculates reserve recommendation, available money and reserve health", () => {
    const period = calculatePeriodCashBreakdown(entries, rules, cashProfile);
    expect(period.recommendedReserveCents).toBeGreaterThan(0);
    expect(calculateSafeAvailableMoney({ bankBalanceCents: 2_000_00, targetReserveCents: 800_00, manuallyReservedCents: 500_00 })).toBe(1_700_00);
    expect(calculateReserveHealth(1_000_00, 900_00).status).toBe("MISSING");
    expect(calculateReserveHealth(1_000_00, 1_000_00).status).toBe("ENOUGH");
  });
});

describe("simulator and reserve", () => {
  it("simulates available from gross and gross needed for target net", () => {
    const available = simulateAvailableFromGross({
      grossAmountCents: 3_000_00,
      activityCategory: "SERVICE_BNC",
      taxWithholdingEnabled: true,
      conservativeReserveBufferRate: 0.05,
      rules,
    });
    expect(available.estimatedAvailableCents).toBe(2_118_00);

    const needed = simulateGrossNeededForTargetNet({
      targetAvailableCents: 2_500_00,
      activityCategory: "SERVICE_BNC",
      profile: cashProfile,
      rules,
    });
    expect(needed.grossRevenueNeededCents).toBeGreaterThan(2_500_00);
    expect(needed.estimatedAvailableCents).toBeGreaterThanOrEqual(2_500_00);
  });

  it("simulates can spend safe/caution/no and reserve events", () => {
    expect(simulateCanSpend({ desiredSpendCents: 300_00, bankBalanceCents: 2_000_00, currentReservedCents: 900_00, upcomingEstimatedDueCents: 900_00 }).decision).toBe("SAFE");
    expect(simulateCanSpend({ desiredSpendCents: 1_100_00, bankBalanceCents: 2_000_00, currentReservedCents: 500_00, upcomingEstimatedDueCents: 900_00 }).decision).toBe("CAUTION");
    expect(simulateCanSpend({ desiredSpendCents: 2_000_00, bankBalanceCents: 2_000_00, currentReservedCents: 300_00, upcomingEstimatedDueCents: 900_00 }).decision).toBe("NO");

    expect(calculateMissingReserve(900_00, 500_00)).toBe(400_00);
    expect(applyReserveEvent(500_00, { type: "SET_ASIDE", amountCents: 200_00 })).toBe(700_00);
    expect(applyReserveEvent(500_00, { type: "RELEASED", amountCents: 700_00 })).toBe(0);
    expect(calculateTargetReserve(entries, rules, cashProfile)).toBeGreaterThan(0);
    expect(getReserveRecommendation({ targetReserveCents: 900_00, manuallyReservedCents: 500_00 }).missingReserveCents).toBe(400_00);
  });

  it("turns cashflow into salary, spend, pricing and runway decisions", () => {
    const salary = calculateSalaryTarget({
      targetAvailableCents: 1_800_00,
      currentAvailableCents: 1_250_00,
      monthCollectedCents: 1_700_00,
      activityCategory: "SERVICE_BNC",
      profile: cashProfile,
      rules,
    });
    expect(salary.grossRevenueNeededCents).toBeGreaterThan(1_800_00);
    expect(salary.remainingRevenueCents).toBeGreaterThan(0);
    expect(salary.safePayableCents).toBe(1_250_00);

    const spend = evaluateSpendDecision({
      desiredSpendCents: 1_499_00,
      safeAvailableCents: 900_00,
      activityCategory: "SERVICE_BNC",
      profile: cashProfile,
      rules,
      dailyRevenuePaceCents: 150_00,
      currentDate: new Date(2026, 4, 11),
    });
    expect(spend.signal).toBe("RED");
    expect(spend.additionalGrossRevenueNeededCents).toBeGreaterThan(0);
    expect(spend.availableFromDate).toBeInstanceOf(Date);

    const pricing = calculateMinimumPricing({
      targetAvailableCents: 2_000_00,
      billableDays: 18,
      averageSaleCents: 150_00,
      activityCategory: "SERVICE_BNC",
      profile: cashProfile,
      rules,
    });
    expect(pricing.minimumDailyRateCents).toBeGreaterThan(0);
    expect(pricing.prudentDailyRateCents).toBeGreaterThan(pricing.minimumDailyRateCents);
    expect(pricing.salesNeeded).toBeGreaterThan(0);

    const stress = calculateRunwayStressTest({
      safeAvailableCents: 1_000_00,
      currentReserveCents: 1_250_00,
      monthlyPersonalNeedCents: 1_800_00,
    });
    expect(stress.runwayDays).toBe(37);
    expect(stress.missingReserveCents).toBe(4_150_00);
  });
});

describe("revenue", () => {
  it("keeps collected revenue only", () => {
    expect(excludePendingOrExcludedEntries(entries)).toHaveLength(2);
    expect(calculateCollectedRevenue(entries)).toBe(15_000_00);
  });

  it("groups revenue by activity", () => {
    expect(groupRevenueByActivity(entries)).toEqual({ SERVICE_BNC: 10_000_00, SERVICE_BIC: 5_000_00 });
  });

  it("assigns monthly and quarterly periods", () => {
    expect(assignRevenueToDeclarationPeriod(entries[0], "MONTHLY")).toMatchObject({
      year: 2026,
      periodType: "MONTH",
      periodIndex: 1,
    });
    expect(assignRevenueToDeclarationPeriod(entries[1], "QUARTERLY")).toMatchObject({
      year: 2026,
      periodType: "QUARTER",
      periodIndex: 1,
    });
  });
});

describe("contributions", () => {
  it("estimates due amounts and net available", () => {
    const estimate = estimateTotalDue({ SERVICE_BNC: 10_000_00, SERVICE_BIC: 5_000_00 }, rules, {
      taxWithholdingEnabled: true,
    });
    expect(estimate.socialContributionsCents).toBe(3_620_00);
    expect(estimate.taxWithholdingCents).toBe(305_00);
    expect(estimate.totalDueCents).toBeGreaterThan(estimate.socialContributionsCents);
    expect(estimateNetAvailable(15_000_00, estimate.totalDueCents)).toBe(15_000_00 - estimate.totalDueCents);
  });
});

describe("thresholds", () => {
  it("evaluates micro threshold usage", () => {
    const usage = evaluateMicroThresholdUsage(
      { SERVICE_BNC: 70_000_00 },
      { mainActivityCategory: "SERVICE_BNC", mixedActivityEnabled: false, vatStatus: "FRANCHISE_BASE" },
      rules
    );
    expect(usage.usagePercent).toBeCloseTo(83.73, 1);
    expect(usage.riskLevel).toBe("WATCH");
  });

  it("evaluates mixed thresholds", () => {
    const usage = evaluateMixedActivityThresholds({ GOODS_SALES: 100_000_00, SERVICE_BNC: 90_000_00 }, rules);
    expect(usage.thresholdCents).toBe(203_100_00);
    expect(usage.serviceUsagePercent).toBeGreaterThan(100);
    expect(usage.riskLevel).toBe("EXCEEDED");
  });

  it("calculates risk level and annual projection", () => {
    expect(getThresholdRiskLevel(74)).toBe("OK");
    expect(getThresholdRiskLevel(91)).toBe("WARNING");
    const projection = projectAnnualRevenue(entries, new Date(2026, 1, 1));
    expect(projection.projectedAnnualRevenueCents).toBeGreaterThan(projection.totalToDateCents);
  });
});

describe("declarations", () => {
  it("generates monthly and quarterly periods", () => {
    expect(generateDeclarationPeriods(2026, "MONTHLY")).toHaveLength(12);
    expect(generateDeclarationPeriods(2026, "QUARTERLY")).toHaveLength(4);
  });

  it("calculates declaration snapshot", () => {
    const period = generateDeclarationPeriods(2026, "MONTHLY")[0];
    const snapshot = calculateDeclarationSnapshot(period, entries, rules, { taxWithholdingEnabled: true });
    expect(snapshot.totalRevenueCents).toBe(10_000_00);
    expect(snapshot.estimatedTotalDueCents).toBeGreaterThan(0);
  });
});

describe("documents", () => {
  it("monthly cash summary includes available money and disclaimer", () => {
    const doc = generateMonthlyCashSummary({
      profile: { businessName: "Studio Demo", ownerName: "Camille" },
      monthLabel: "janvier 2026",
      generatedAt: new Date(2026, 0, 31),
      collectedRevenueCents: 3_000_00,
      recommendedReserveCents: 882_00,
      estimatedAvailableCents: 2_118_00,
      reserveHealthLabel: "Réserve suffisante",
    });
    expect(doc.contentText).toContain("Argent disponible");
    expect(doc.contentText).toContain("ne remplace pas");
  });

  it("declaration summary includes profile, period, totals and disclaimer", () => {
    const doc = generateDeclarationSummary({
      profile: { businessName: "Studio Demo", ownerName: "Camille" },
      periodLabel: "janvier 2026",
      generatedAt: new Date(2026, 0, 31),
      totalRevenueCents: 10_000_00,
      estimatedTotalDueCents: 2_800_00,
      estimatedNetCents: 7_200_00,
      lines: [{ activityCategory: "SERVICE_BNC", revenueCents: 10_000_00 }],
    });
    expect(doc.contentText).toContain("Studio Demo");
    expect(doc.contentText).toContain("janvier 2026");
    expect(doc.contentText.replace(/\s/g, " ")).toContain(formatMoney(10_000_00).replace(/\s/g, " "));
    expect(doc.contentText).toContain("ne remplace pas");
  });

  it("threshold report includes warning and status", () => {
    const doc = generateThresholdReport({
      profile: { businessName: "Studio Demo" },
      generatedAt: new Date(),
      year: 2026,
      totalRevenueCents: 70_000_00,
      thresholdCents: 83_600_00,
      usagePercent: 83.7,
      riskLabel: "WATCH",
      vatMessage: "Seuil à surveiller",
    });
    expect(doc.contentText).toContain("Seuil à surveiller");
    expect(doc.contentText).toContain("WATCH");
  });
});

describe("billing and auth helpers", () => {
  it("enforces plan limits", () => {
    expect(PLAN_LIMITS.FREE.revenueEntriesPerMonth).toBe(5);
    expect(PLAN_LIMITS.STARTER.label).toBe("Solo");
    expect(PLAN_LIMITS.PRO.priceMonthly).toBe(19);
    expect(isWithinPlanLimit("FREE", "clients", 1)).toBe(false);
    expect(planAllows("FREE", "documentExport")).toBe(false);
    expect(planAllows("FREE", "advancedSimulator")).toBe(false);
    expect(planAllows("PRO", "advancedReserveTracking")).toBe(true);
    expect(planAllows("PRO", "accountantExport")).toBe(true);
  });

  it("hashes and expires tokens", () => {
    expect(hashToken("abc")).toHaveLength(64);
    expect(isExpired(new Date(2020, 1, 1), new Date(2026, 1, 1))).toBe(true);
    expect(isTokenUsable({ expiresAt: new Date(2026, 1, 2), usedAt: null }, new Date(2026, 1, 1))).toBe(true);
    expect(isTokenUsable({ expiresAt: new Date(2026, 1, 2), usedAt: new Date() }, new Date(2026, 1, 1))).toBe(false);
  });
});
