import { differenceInCalendarDays, endOfYear, startOfYear } from "date-fns";
import { ActivityCategory, isServiceCategory, VatStatus } from "@/domain/activity";
import { RevenueLike, groupRevenueByActivity } from "@/domain/revenue/revenue";
import { getThresholdRule, RulesConfiguration } from "@/domain/rules/default-rules";

export type ThresholdRiskLevel = "OK" | "WATCH" | "WARNING" | "EXCEEDED";

export type ThresholdProfile = {
  mainActivityCategory: ActivityCategory;
  mixedActivityEnabled: boolean;
  vatStatus: VatStatus;
};

export function evaluateMicroThresholdUsage(
  annualRevenueByActivity: Partial<Record<ActivityCategory, number>>,
  profile: ThresholdProfile,
  rules: RulesConfiguration
) {
  const totalRevenueCents = Object.values(annualRevenueByActivity).reduce((sum, cents) => sum + (cents ?? 0), 0);
  const mainRule = getThresholdRule(profile.mixedActivityEnabled ? "MIXED" : profile.mainActivityCategory, rules.year);
  const serviceRevenueCents = Object.entries(annualRevenueByActivity).reduce((sum, [category, cents]) => {
    return sum + (isServiceCategory(category as ActivityCategory) ? cents ?? 0 : 0);
  }, 0);
  const usagePercent = (totalRevenueCents / mainRule.microThresholdCents) * 100;
  const serviceUsagePercent = mainRule.servicePartThresholdCents
    ? (serviceRevenueCents / mainRule.servicePartThresholdCents) * 100
    : null;

  return {
    totalRevenueCents,
    serviceRevenueCents,
    thresholdCents: mainRule.microThresholdCents,
    servicePartThresholdCents: mainRule.servicePartThresholdCents,
    usagePercent,
    serviceUsagePercent,
    riskLevel: getThresholdRiskLevel(Math.max(usagePercent, serviceUsagePercent ?? 0)),
    notes: mainRule.notes,
  };
}

export function evaluateMixedActivityThresholds(
  annualRevenueByActivity: Partial<Record<ActivityCategory, number>>,
  rules: RulesConfiguration
) {
  return evaluateMicroThresholdUsage(
    annualRevenueByActivity,
    { mainActivityCategory: "MIXED", mixedActivityEnabled: true, vatStatus: "UNKNOWN" },
    rules
  );
}

export function evaluateVatWarning(
  annualRevenueByActivity: Partial<Record<ActivityCategory, number>>,
  profile: ThresholdProfile,
  rules: RulesConfiguration
) {
  const annualRevenueCents = Object.values(annualRevenueByActivity).reduce((sum, cents) => sum + (cents ?? 0), 0);
  const hasGoods = Object.entries(annualRevenueByActivity).some(
    ([category, cents]) =>
      (category === "GOODS_SALES" || category === "ACCOMMODATION_CLASSIFIED") && (cents ?? 0) > 0
  );
  const rule = getThresholdRule(hasGoods ? "GOODS_SALES" : profile.mainActivityCategory, rules.year);
  const base = rule.vatBaseThresholdCents ?? 0;
  const increased = rule.vatIncreasedThresholdCents ?? base;
  const usagePercent = base > 0 ? (annualRevenueCents / base) * 100 : 0;

  let message = "Seuil TVA à surveiller selon votre situation.";
  if (profile.vatStatus === "VAT_LIABLE") {
    message = "Vous avez indiqué étre redevable de la TVA : surveillez vos obligations déclaratives séparément.";
  } else if (annualRevenueCents >= increased) {
    message = "Limite majorée de franchise TVA potentiellement dépassée : vérification urgente recommandée.";
  } else if (annualRevenueCents >= base) {
    message = "Seuil de base de franchise TVA dépassé ou proche : vérifiez la date d'effet applicable.";
  } else if (usagePercent >= 80) {
    message = "Seuil de franchise TVA à surveiller de près.";
  }

  return {
    annualRevenueCents,
    vatBaseThresholdCents: base,
    vatIncreasedThresholdCents: increased,
    usagePercent,
    riskLevel: getThresholdRiskLevel((annualRevenueCents / Math.max(1, increased)) * 100),
    message,
    notes: rule.notes,
  };
}

export function projectAnnualRevenue(entries: RevenueLike[], currentDate: Date) {
  const start = startOfYear(currentDate);
  const end = endOfYear(currentDate);
  const elapsedDays = Math.max(1, differenceInCalendarDays(currentDate, start) + 1);
  const yearDays = differenceInCalendarDays(end, start) + 1;
  const revenueToDate = groupRevenueByActivity(
    entries.filter((entry) => new Date(entry.collectionDate).getFullYear() === currentDate.getFullYear())
  );
  const totalToDateCents = Object.values(revenueToDate).reduce((sum, cents) => sum + cents, 0);
  const projectedAnnualRevenueCents = Math.round((totalToDateCents / elapsedDays) * yearDays);

  return {
    totalToDateCents,
    projectedAnnualRevenueCents,
    elapsedDays,
    yearDays,
  };
}

export function getThresholdRiskLevel(usagePercent: number): ThresholdRiskLevel {
  if (usagePercent >= 100) return "EXCEEDED";
  if (usagePercent >= 90) return "WARNING";
  if (usagePercent >= 75) return "WATCH";
  return "OK";
}
