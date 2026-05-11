import { addMonths, endOfMonth, endOfQuarter, getQuarter, startOfMonth, startOfQuarter } from "date-fns";
import { ActivityCategory, DeclarationFrequency, PeriodType, RevenueStatus } from "@/domain/activity";

export type RevenueLike = {
  activityCategory: ActivityCategory;
  collectionDate: Date;
  grossAmountCents: number;
  status: RevenueStatus;
};

export type DeclarationPeriodDraft = {
  year: number;
  periodType: PeriodType;
  periodIndex: number;
  label: string;
  startDate: Date;
  endDate: Date;
  dueDate: Date;
};

export function excludePendingOrExcludedEntries<T extends { status: RevenueStatus }>(entries: T[]) {
  return entries.filter((entry) => entry.status === "COLLECTED");
}

export function calculateCollectedRevenue(entries: RevenueLike[]) {
  return excludePendingOrExcludedEntries(entries).reduce((sum, entry) => sum + entry.grossAmountCents, 0);
}

export function calculateAnnualCollectedRevenue(entries: RevenueLike[], year: number) {
  return calculateCollectedRevenue(entries.filter((entry) => entry.collectionDate.getFullYear() === year));
}

export function groupRevenueByActivity(entries: RevenueLike[]) {
  return excludePendingOrExcludedEntries(entries).reduce<Record<ActivityCategory, number>>((acc, entry) => {
    acc[entry.activityCategory] = (acc[entry.activityCategory] ?? 0) + entry.grossAmountCents;
    return acc;
  }, {} as Record<ActivityCategory, number>);
}

export function assignRevenueToDeclarationPeriod(
  revenueEntry: Pick<RevenueLike, "collectionDate">,
  frequency: DeclarationFrequency
): DeclarationPeriodDraft {
  const collectionDate = new Date(revenueEntry.collectionDate);

  if (frequency === "QUARTERLY") {
    const quarter = getQuarter(collectionDate);
    const startDate = startOfQuarter(collectionDate);
    const endDate = endOfQuarter(collectionDate);
    return {
      year: collectionDate.getFullYear(),
      periodType: "QUARTER",
      periodIndex: quarter,
      label: `T${quarter} ${collectionDate.getFullYear()}`,
      startDate,
      endDate,
      dueDate: getDueDate(endDate, "QUARTERLY"),
    };
  }

  const month = collectionDate.getMonth() + 1;
  const startDate = startOfMonth(collectionDate);
  const endDate = endOfMonth(collectionDate);
  return {
    year: collectionDate.getFullYear(),
    periodType: "MONTH",
    periodIndex: month,
    label: new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(collectionDate),
    startDate,
    endDate,
    dueDate: getDueDate(endDate, "MONTHLY"),
  };
}

export function getDueDate(periodEnd: Date, frequency: DeclarationFrequency) {
  if (frequency === "QUARTERLY") {
    return endOfMonth(addMonths(periodEnd, 1));
  }
  return endOfMonth(addMonths(periodEnd, 1));
}
