import { addMonths, endOfMonth, endOfQuarter, isAfter, isWithinInterval, startOfMonth, startOfQuarter } from "date-fns";
import { DeclarationFrequency, PeriodType } from "@/domain/activity";
import { estimateTotalDue } from "@/domain/contributions/contributions";
import { groupRevenueByActivity, RevenueLike } from "@/domain/revenue/revenue";
import { RulesConfiguration } from "@/domain/rules/default-rules";

export type DeclarationStatus = "OPEN" | "READY" | "DECLARED" | "PAID" | "LATE";

export type PeriodLike = {
  year: number;
  periodType: PeriodType;
  periodIndex: number;
  label: string;
  startDate: Date;
  endDate: Date;
  dueDate: Date | null;
  status?: DeclarationStatus;
};

export function generateDeclarationPeriods(year: number, frequency: DeclarationFrequency): PeriodLike[] {
  if (frequency === "QUARTERLY") {
    return [1, 2, 3, 4].map((quarter) => {
      const anchor = new Date(year, (quarter - 1) * 3, 1);
      const endDate = endOfQuarter(anchor);
      return {
        year,
        periodType: "QUARTER",
        periodIndex: quarter,
        label: `T${quarter} ${year}`,
        startDate: startOfQuarter(anchor),
        endDate,
        dueDate: getNextDeclarationDueDate({ endDate }, frequency),
        status: "OPEN",
      };
    });
  }

  return Array.from({ length: 12 }, (_, index) => {
    const anchor = new Date(year, index, 1);
    const endDate = endOfMonth(anchor);
    return {
      year,
      periodType: "MONTH",
      periodIndex: index + 1,
      label: new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(anchor),
      startDate: startOfMonth(anchor),
      endDate,
      dueDate: getNextDeclarationDueDate({ endDate }, frequency),
      status: "OPEN",
    };
  });
}

export function getCurrentDeclarationPeriod(date: Date, frequency: DeclarationFrequency) {
  const periods = generateDeclarationPeriods(date.getFullYear(), frequency);
  return periods.find((period) =>
    isWithinInterval(date, { start: period.startDate, end: period.endDate })
  )!;
}

export function calculateDeclarationSnapshot(
  period: Pick<PeriodLike, "startDate" | "endDate">,
  revenueEntries: RevenueLike[],
  rules: RulesConfiguration,
  options: { taxWithholdingEnabled: boolean }
) {
  const includedEntries = revenueEntries.filter((entry) =>
    isWithinInterval(new Date(entry.collectionDate), {
      start: new Date(period.startDate),
      end: new Date(period.endDate),
    })
  );
  const revenueByActivity = groupRevenueByActivity(includedEntries);
  const estimates = estimateTotalDue(revenueByActivity, rules, options);
  const totalRevenueCents = Object.values(revenueByActivity).reduce((sum, cents) => sum + cents, 0);

  return {
    totalRevenueCents,
    estimatedSocialContributionsCents: estimates.socialContributionsCents,
    estimatedTrainingContributionCents: estimates.trainingContributionsCents,
    estimatedTaxWithholdingCents: estimates.taxWithholdingCents,
    estimatedTotalDueCents: estimates.totalDueCents,
    estimatedNetCents: estimates.netAvailableCents,
    breakdownJson: {
      revenueByActivity,
      breakdown: estimates.breakdown,
      disclaimer: rules.legalDisclaimer,
    },
  };
}

export function getDeclarationStatus(period: PeriodLike, currentDate: Date): DeclarationStatus {
  if (period.status === "PAID" || period.status === "DECLARED" || period.status === "READY") {
    return period.status;
  }
  if (period.dueDate && isAfter(currentDate, period.dueDate)) return "LATE";
  return period.status ?? "OPEN";
}

export function getNextDeclarationDueDate(
  period: Pick<PeriodLike, "endDate">,
  frequency: DeclarationFrequency
) {
  return endOfMonth(addMonths(new Date(period.endDate), frequency === "QUARTERLY" ? 1 : 1));
}
