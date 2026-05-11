import Link from "next/link";
import { ArrowLeft, ArrowRight, Gauge, ShieldCheck, TrendingUp, WalletCards } from "lucide-react";
import { endOfMonth, endOfYear, startOfMonth, startOfYear, subYears } from "date-fns";
import { Card, SectionHeader } from "@/components/ui/card";
import { calculatePeriodCashBreakdown } from "@/domain/cashflow/cashflow";
import { formatMoney, formatPercent } from "@/domain/formatting/format";
import { activityLabels } from "@/domain/activity";
import { groupRevenueByActivity } from "@/domain/revenue/revenue";
import { getRulesForYear } from "@/domain/rules/default-rules";
import { projectAnnualRevenue } from "@/domain/thresholds/thresholds";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type SearchParams = {
  year?: string;
};

export default async function ForecastPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const user = await requireUser();
  const params = (await searchParams) ?? {};
  const now = new Date();
  const selectedYear = parseYear(params.year, now.getFullYear());
  const selectedDate = new Date(selectedYear, 0, 1);
  const previousDate = subYears(selectedDate, 1);
  const profile = await prisma.businessProfile.findUniqueOrThrow({ where: { userId: user.id } });

  const [entries, previousEntries] = await Promise.all([
    prisma.revenueEntry.findMany({
      where: {
        userId: user.id,
        collectionDate: { gte: startOfYear(selectedDate), lte: endOfYear(selectedDate) },
      },
      orderBy: { collectionDate: "asc" },
    }),
    prisma.revenueEntry.findMany({
      where: {
        userId: user.id,
        collectionDate: { gte: startOfYear(previousDate), lte: endOfYear(previousDate) },
      },
      orderBy: { collectionDate: "asc" },
    }),
  ]);

  const rules = getRulesForYear(profile.contributionRulesYear);
  const cashProfile = {
    taxWithholdingEnabled: profile.taxWithholdingEnabled,
    conservativeReserveBufferRate: Number(profile.conservativeReserveBufferRate),
  };
  const revenueLike = entries.map((entry) => ({
    activityCategory: entry.activityCategory,
    collectionDate: entry.collectionDate,
    grossAmountCents: entry.grossAmountCents,
    status: entry.status,
  }));
  const previousRevenueLike = previousEntries.map((entry) => ({
    activityCategory: entry.activityCategory,
    collectionDate: entry.collectionDate,
    grossAmountCents: entry.grossAmountCents,
    status: entry.status,
  }));
  const cash = calculatePeriodCashBreakdown(revenueLike, rules, cashProfile);
  const previousCash = calculatePeriodCashBreakdown(previousRevenueLike, rules, cashProfile);
  const projectionDate = selectedYear === now.getFullYear() ? now : endOfYear(selectedDate);
  const projection = projectAnnualRevenue(revenueLike, projectionDate);
  const byActivity = groupRevenueByActivity(revenueLike);
  const previousByActivity = groupRevenueByActivity(previousRevenueLike);
  const reserveRate = cash.grossAmountCents > 0 ? (cash.recommendedReserveCents / cash.grossAmountCents) * 100 : 0;
  const projectedRemainingCents = Math.max(0, projection.projectedAnnualRevenueCents - projection.totalToDateCents);

  return (
    <>
      <SectionHeader
        action={
          <div className="flex flex-wrap gap-2">
            <YearLink direction="prev" year={selectedYear - 1} />
            <YearLink direction="next" year={selectedYear + 1} />
          </div>
        }
        description="Bilan annuel, projection fin d'année et comparaison avec l'année précédente."
        title={`Prévisions ${selectedYear}`}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric
          comparison={comparison(cash.grossAmountCents, previousCash.grossAmountCents)}
          icon={WalletCards}
          label="CA encaissé"
          value={formatMoney(cash.grossAmountCents)}
        />
        <Metric
          comparison={comparison(projection.projectedAnnualRevenueCents, previousCash.grossAmountCents)}
          icon={TrendingUp}
          label="Projection annuelle"
          value={formatMoney(projection.projectedAnnualRevenueCents)}
        />
        <Metric
          comparison={comparison(cash.recommendedReserveCents, previousCash.recommendedReserveCents)}
          icon={ShieldCheck}
          label="Réserve moyenne"
          value={formatMoney(cash.recommendedReserveCents)}
        />
        <Metric icon={Gauge} label="Taux de réserve" value={formatPercent(reserveRate, 0)} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <Card>
          <h2 className="text-lg font-semibold text-[#061b31]">Projection vs réalité</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <Stat label="Réel à date" value={formatMoney(projection.totalToDateCents)} />
            <Stat label="Encore projeté" value={formatMoney(projectedRemainingCents)} />
            <Stat label="Fin d'année estimée" value={formatMoney(projection.projectedAnnualRevenueCents)} />
          </div>
          <div className="mt-5 h-3 overflow-hidden rounded-[6px] bg-[#eef4f8]">
            <div
              className="h-full rounded-[6px] bg-[#0c8c5e]"
              style={{
                width: `${Math.max(
                  0,
                  Math.min(100, (projection.totalToDateCents / Math.max(1, projection.projectedAnnualRevenueCents)) * 100)
                )}%`,
              }}
            />
          </div>
          <p className="mt-3 text-sm leading-6 text-[#50617a]">
            AutoNet projette à partir du rythme déjà encaissé sur {projection.elapsedDays} jours.
          </p>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-[#061b31]">Répartition par activité</h2>
          <div className="mt-4 divide-y divide-[#d8dfe8]">
            {Object.entries(byActivity).map(([category, cents]) => {
              const previousCents = previousByActivity[category as keyof typeof previousByActivity] ?? 0;
              return (
                <div className="flex items-center justify-between gap-4 py-3 text-sm" key={category}>
                  <div>
                    <p className="font-medium text-[#061b31]">{activityLabels[category as keyof typeof activityLabels]}</p>
                    <p className={comparisonTextClassName(comparison(cents, previousCents).tone)}>
                      {comparison(cents, previousCents).label}
                    </p>
                  </div>
                  <span className="font-semibold tabular-nums text-[#061b31]">{formatMoney(cents)}</span>
                </div>
              );
            })}
            {!Object.keys(byActivity).length ? (
              <p className="py-6 text-center text-sm text-[#64748d]">Aucun encaissement sur cette année.</p>
            ) : null}
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="text-lg font-semibold text-[#061b31]">Mois par mois</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="text-left text-[#64748d]">
              <tr>
                <th className="py-2 font-medium">Mois</th>
                <th className="font-medium">{selectedYear}</th>
                <th className="font-medium">{selectedYear - 1}</th>
                <th className="font-medium">Évolution</th>
                <th className="font-medium">Disponible prudent</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 12 }, (_, monthIndex) => {
                const monthDate = new Date(selectedYear, monthIndex, 1);
                const previousMonthDate = new Date(selectedYear - 1, monthIndex, 1);
                const monthCash = calculatePeriodCashBreakdown(
                  revenueLike.filter(
                    (entry) => entry.collectionDate >= startOfMonth(monthDate) && entry.collectionDate <= endOfMonth(monthDate)
                  ),
                  rules,
                  cashProfile
                );
                const previousMonthCash = calculatePeriodCashBreakdown(
                  previousRevenueLike.filter(
                    (entry) =>
                      entry.collectionDate >= startOfMonth(previousMonthDate) &&
                      entry.collectionDate <= endOfMonth(previousMonthDate)
                  ),
                  rules,
                  cashProfile
                );
                const monthComparison = comparison(monthCash.grossAmountCents, previousMonthCash.grossAmountCents);
                return (
                  <tr className="border-t border-[#eef4f8]" key={monthIndex}>
                    <td className="py-3 font-medium text-[#061b31]">{monthLabel(monthDate)}</td>
                    <td>{formatMoney(monthCash.grossAmountCents)}</td>
                    <td>{formatMoney(previousMonthCash.grossAmountCents)}</td>
                    <td className={comparisonTextClassName(monthComparison.tone)}>{monthComparison.label}</td>
                    <td className="font-semibold text-[#0c8c5e]">{formatMoney(monthCash.estimatedAvailableCents)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  comparison: metricComparison,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  value: string;
  comparison?: { label: string; tone: "positive" | "negative" | "neutral" };
}) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <Icon aria-hidden className="h-5 w-5 text-[#2f6fed]" />
        <p className="text-sm font-medium text-[#50617a]">{label}</p>
      </div>
      <p className="mt-3 text-2xl font-semibold tabular-nums text-[#061b31]">{value}</p>
      {metricComparison ? <p className={comparisonTextClassName(metricComparison.tone)}>{metricComparison.label}</p> : null}
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[6px] border border-[#d8dfe8] bg-[#f8fafd] p-4">
      <p className="text-sm text-[#50617a]">{label}</p>
      <p className="mt-2 text-xl font-semibold text-[#061b31]">{value}</p>
    </div>
  );
}

function YearLink({ direction, year }: { direction: "prev" | "next"; year: number }) {
  return (
    <Link
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[6px] border border-[#d8dfe8] bg-white px-4 py-2 text-sm font-semibold text-[#061b31] hover:bg-[#f8fafd]"
      href={`/app/previsions?year=${year}`}
    >
      {direction === "prev" ? <ArrowLeft aria-hidden className="h-4 w-4" /> : null}
      {year}
      {direction === "next" ? <ArrowRight aria-hidden className="h-4 w-4" /> : null}
    </Link>
  );
}

function comparison(currentCents: number, previousCents: number) {
  if (previousCents === 0) {
    return {
      label: currentCents > 0 ? "Nouveau vs année précédente" : "Stable",
      tone: currentCents > 0 ? "positive" : "neutral",
    } as const;
  }
  const percent = ((currentCents - previousCents) / Math.abs(previousCents)) * 100;
  return {
    label: `${percent >= 0 ? "+" : ""}${formatPercent(percent, 0)} vs année précédente`,
    tone: percent >= 0 ? "positive" : "negative",
  } as const;
}

function comparisonTextClassName(tone: "positive" | "negative" | "neutral") {
  const color = {
    positive: "text-[#0c8c5e]",
    negative: "text-red-700",
    neutral: "text-[#64748d]",
  }[tone];
  return `mt-2 text-xs font-semibold ${color}`;
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", { month: "long" }).format(date);
}

function parseYear(value: string | undefined, fallback: number) {
  const year = Number.parseInt(value ?? "", 10);
  if (Number.isFinite(year) && year >= 2020 && year <= 2035) return year;
  return fallback;
}
