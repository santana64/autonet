import { ActivityCategory } from "@/domain/activity";
import { getContributionRate, RulesConfiguration } from "@/domain/rules/default-rules";

export type RevenueByActivity = Partial<Record<ActivityCategory, number>>;

export type ContributionEstimate = {
  socialContributionsCents: number;
  trainingContributionsCents: number;
  taxWithholdingCents: number;
  totalDueCents: number;
  netAvailableCents: number;
  breakdown: Array<{
    activityCategory: ActivityCategory;
    revenueCents: number;
    socialContributionRate: number;
    trainingContributionRate: number | null;
    taxWithholdingRate: number | null;
    socialCents: number;
    trainingCents: number;
    taxCents: number;
  }>;
};

export function estimateSocialContributions(revenueByActivity: RevenueByActivity, rules: RulesConfiguration) {
  return Object.entries(revenueByActivity).reduce((sum, [category, cents]) => {
    const rate = getContributionRate(category as ActivityCategory, rules.year);
    return sum + Math.round((cents ?? 0) * rate.socialContributionRate);
  }, 0);
}

export function estimateTrainingContributions(revenueByActivity: RevenueByActivity, rules: RulesConfiguration) {
  return Object.entries(revenueByActivity).reduce((sum, [category, cents]) => {
    const rate = getContributionRate(category as ActivityCategory, rules.year);
    return sum + Math.round((cents ?? 0) * (rate.trainingContributionRate ?? 0));
  }, 0);
}

export function estimateTaxWithholding(
  revenueByActivity: RevenueByActivity,
  rules: RulesConfiguration,
  enabled: boolean
) {
  if (!enabled) return 0;
  return Object.entries(revenueByActivity).reduce((sum, [category, cents]) => {
    const rate = getContributionRate(category as ActivityCategory, rules.year);
    return sum + Math.round((cents ?? 0) * (rate.taxWithholdingRate ?? 0));
  }, 0);
}

export function estimateTotalDue(
  revenueByActivity: RevenueByActivity,
  rules: RulesConfiguration,
  options: { taxWithholdingEnabled: boolean }
): ContributionEstimate {
  const breakdown = Object.entries(revenueByActivity)
    .filter(([, revenueCents]) => (revenueCents ?? 0) > 0)
    .map(([category, revenueCents]) => {
      const activityCategory = category as ActivityCategory;
      const rate = getContributionRate(activityCategory, rules.year);
      const socialCents = Math.round((revenueCents ?? 0) * rate.socialContributionRate);
      const trainingCents = Math.round((revenueCents ?? 0) * (rate.trainingContributionRate ?? 0));
      const taxCents = options.taxWithholdingEnabled
        ? Math.round((revenueCents ?? 0) * (rate.taxWithholdingRate ?? 0))
        : 0;

      return {
        activityCategory,
        revenueCents: revenueCents ?? 0,
        socialContributionRate: rate.socialContributionRate,
        trainingContributionRate: rate.trainingContributionRate,
        taxWithholdingRate: options.taxWithholdingEnabled ? rate.taxWithholdingRate : null,
        socialCents,
        trainingCents,
        taxCents,
      };
    });

  const socialContributionsCents = breakdown.reduce((sum, item) => sum + item.socialCents, 0);
  const trainingContributionsCents = breakdown.reduce((sum, item) => sum + item.trainingCents, 0);
  const taxWithholdingCents = breakdown.reduce((sum, item) => sum + item.taxCents, 0);
  const totalRevenueCents = breakdown.reduce((sum, item) => sum + item.revenueCents, 0);
  const totalDueCents = socialContributionsCents + trainingContributionsCents + taxWithholdingCents;

  return {
    socialContributionsCents,
    trainingContributionsCents,
    taxWithholdingCents,
    totalDueCents,
    netAvailableCents: estimateNetAvailable(totalRevenueCents, totalDueCents),
    breakdown,
  };
}

export function estimateNetAvailable(revenueCents: number, estimatedDueCents: number) {
  return Math.max(0, revenueCents - estimatedDueCents);
}
