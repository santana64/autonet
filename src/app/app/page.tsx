import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BadgeEuro,
  Calculator,
  CircleAlert,
  CircleCheck,
  Gauge,
  Plus,
  ShieldCheck,
  ShoppingBag,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import {
  differenceInCalendarDays,
  endOfMonth,
  endOfQuarter,
  endOfYear,
  subMonths,
  startOfMonth,
  startOfQuarter,
  startOfYear,
} from "date-fns";
import { ButtonLink } from "@/components/ui/button";
import { Card, SectionHeader } from "@/components/ui/card";
import {
  calculatePeriodCashBreakdown,
  calculateReserveHealth,
  calculateSafeAvailableMoney,
} from "@/domain/cashflow/cashflow";
import { DecisionSignal, calculateMinimumPricing, calculateRunwayStressTest, calculateSalaryTarget, evaluateSpendDecision } from "@/domain/simulator/simulator";
import { formatMoney, formatPercent, formatShortDate, eurosToCents } from "@/domain/formatting/format";
import { groupRevenueByActivity } from "@/domain/revenue/revenue";
import { getRulesForYear } from "@/domain/rules/default-rules";
import { evaluateMicroThresholdUsage, evaluateVatWarning, projectAnnualRevenue } from "@/domain/thresholds/thresholds";
import { requireUser } from "@/lib/auth";
import { ensureDeclarationPeriods } from "@/lib/periods";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ salary?: string; spend?: string; days?: string; sale?: string }>;
}) {
  const user = await requireUser();
  const params = (await searchParams) ?? {};
  const profile = await prisma.businessProfile.findUniqueOrThrow({ where: { userId: user.id } });
  const now = new Date();
  const entryCount = await prisma.revenueEntry.count({ where: { userId: user.id } });
  if (entryCount === 0) redirect("/app/onboarding");
  await ensureDeclarationPeriods(user.id, now.getFullYear(), profile.declarationFrequency);

  const previousMonth = subMonths(now, 1);
  const [entries, previousMonthEntries, periods, reserveSnapshot] = await Promise.all([
    prisma.revenueEntry.findMany({
      where: { userId: user.id, collectionDate: { gte: startOfYear(now), lte: endOfYear(now) } },
      orderBy: { collectionDate: "desc" },
    }),
    prisma.revenueEntry.findMany({
      where: {
        userId: user.id,
        collectionDate: { gte: startOfMonth(previousMonth), lte: endOfMonth(previousMonth) },
      },
      orderBy: { collectionDate: "desc" },
    }),
    prisma.declarationPeriod.findMany({
      where: { userId: user.id, year: now.getFullYear() },
      orderBy: [{ startDate: "asc" }],
    }),
    prisma.cashReserveSnapshot.findFirst({
      where: { userId: user.id },
      orderBy: { snapshotDate: "desc" },
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
  const previousMonthRevenueLike = previousMonthEntries.map((entry) => ({
    activityCategory: entry.activityCategory,
    collectionDate: entry.collectionDate,
    grossAmountCents: entry.grossAmountCents,
    status: entry.status,
  }));
  const monthEntries = revenueLike.filter(
    (entry) => entry.collectionDate >= startOfMonth(now) && entry.collectionDate <= endOfMonth(now)
  );
  const quarterEntries = revenueLike.filter(
    (entry) => entry.collectionDate >= startOfQuarter(now) && entry.collectionDate <= endOfQuarter(now)
  );
  const monthCash = calculatePeriodCashBreakdown(monthEntries, rules, cashProfile);
  const previousMonthCash = calculatePeriodCashBreakdown(previousMonthRevenueLike, rules, cashProfile);
  const quarterCash = calculatePeriodCashBreakdown(quarterEntries, rules, cashProfile);
  const annualByActivity = groupRevenueByActivity(revenueLike);
  const annualRevenue = Object.values(annualByActivity).reduce((sum, cents) => sum + cents, 0);
  const threshold = evaluateMicroThresholdUsage(annualByActivity, profile, rules);
  const vat = evaluateVatWarning(annualByActivity, profile, rules);
  const annualProjection = projectAnnualRevenue(revenueLike, now);
  const reserveHealth = calculateReserveHealth(
    monthCash.recommendedReserveCents,
    reserveSnapshot?.manuallyReservedCents ?? 0
  );
  const safeAvailable = calculateSafeAvailableMoney({
    bankBalanceCents: reserveSnapshot?.bankBalanceCents ?? monthCash.grossAmountCents,
    targetReserveCents: monthCash.recommendedReserveCents,
    manuallyReservedCents: reserveSnapshot?.manuallyReservedCents ?? 0,
  });
  const nextPeriod = periods.find((period) => period.dueDate && period.dueDate >= now && period.status !== "PAID");
  const salaryTargetCents = eurosToCents(params.salary ?? "1800");
  const desiredSpendCents = eurosToCents(params.spend ?? "1499");
  const billableDays = Number.parseInt(params.days ?? "18", 10);
  const averageSaleCents = eurosToCents(params.sale ?? "150");
  const elapsedMonthDays = Math.max(1, differenceInCalendarDays(now, startOfMonth(now)) + 1);
  const dailyRevenuePaceCents = Math.round(monthCash.grossAmountCents / elapsedMonthDays);
  const salary = calculateSalaryTarget({
    targetAvailableCents: salaryTargetCents,
    currentAvailableCents: safeAvailable,
    monthCollectedCents: monthCash.grossAmountCents,
    activityCategory: profile.mainActivityCategory,
    profile: cashProfile,
    rules,
  });
  const spendDecision = evaluateSpendDecision({
    desiredSpendCents,
    safeAvailableCents: safeAvailable,
    activityCategory: profile.mainActivityCategory,
    profile: cashProfile,
    rules,
    dailyRevenuePaceCents,
    currentDate: now,
  });
  const pricing = calculateMinimumPricing({
    targetAvailableCents: salaryTargetCents,
    billableDays,
    averageSaleCents,
    activityCategory: profile.mainActivityCategory,
    profile: cashProfile,
    rules,
  });
  const stress = calculateRunwayStressTest({
    safeAvailableCents: safeAvailable,
    currentReserveCents: reserveSnapshot?.manuallyReservedCents ?? 0,
    monthlyPersonalNeedCents: salaryTargetCents,
  });
  const cockpitSignal = getCockpitSignal(salary.signal, reserveHealth.status, threshold.riskLevel, vat.riskLevel);
  const signal = signalConfig[cockpitSignal];
  const vatRemainingCents = Math.max(0, vat.vatBaseThresholdCents - annualRevenue);
  const microRemainingCents = Math.max(0, threshold.thresholdCents - threshold.totalRevenueCents);

  return (
    <>
      <SectionHeader
        action={
          <div className="flex flex-wrap gap-2">
            <ButtonLink href="/app/entries/new">
              <Plus aria-hidden className="h-4 w-4" />
              Ajouter un encaissement
            </ButtonLink>
            <ButtonLink href="/app/simulateur" variant="secondary">
              <ShoppingBag aria-hidden className="h-4 w-4" />
              Simuler une dépense
            </ButtonLink>
          </div>
        }
        description="AutoNet transforme ton chiffre d'affaires en décisions simples : quoi garder, quoi te verser, quoi éviter."
        title="Ton vrai argent ce mois-ci"
      />

      <Card className={`border-l-4 ${signal.border} ${signal.bgTint}`}>
        <div className="grid gap-8 xl:grid-cols-[1fr_0.8fr]">
          <div>
            <div className={`inline-flex items-center gap-2 rounded-[6px] px-3 py-1 text-sm font-semibold ${signal.badge}`}>
              <signal.icon aria-hidden className="h-4 w-4" />
              {signal.label}
            </div>
            <p className="mt-5 text-sm font-medium text-[#50617a]">Argent vraiment utilisable</p>
            <h2 className="mt-2 text-5xl font-semibold tracking-tight text-[#061b31] sm:text-6xl">{formatMoney(safeAvailable)}</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#50617a]">
              Tu peux te verser {formatMoney(salary.safePayableCents)} sans danger maintenant.
              {salary.safetyMarginCents > 0
                ? ` Garde ${formatMoney(salary.safetyMarginCents)} en marge de sécurité.`
                : ` Il manque encore ${formatMoney(salary.remainingRevenueCents)} de CA pour viser ${formatMoney(salary.targetAvailableCents)} ce mois-ci.`}
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              <Link className="inline-flex items-center gap-2 font-semibold text-[#0c8c5e] hover:text-[#08764f]" href="/app/entries">
                Voir les encaissements
                <ArrowRight aria-hidden className="h-4 w-4" />
              </Link>
              <Link className="inline-flex items-center gap-2 font-semibold text-[#2f6fed] hover:text-[#2457bd]" href="/app/reserve">
                Ajuster la réserve
                <ArrowRight aria-hidden className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="divide-y divide-[#d8dfe8]">
            <MoneyRow label="Tu as encaissé" value={formatMoney(monthCash.grossAmountCents)} />
            <MoneyRow
              label="À réserver URSSAF"
              value={formatMoney(monthCash.socialContributionEstimateCents + monthCash.trainingContributionEstimateCents)}
            />
            <MoneyRow label="À réserver impôt" value={formatMoney(monthCash.taxWithholdingEstimateCents)} />
            <MoneyRow label="Marge prudente recommandée" value={formatMoney(monthCash.conservativeBufferCents)} />
            <MoneyRow label="Risque CFE / charges fixes" value="À renseigner" muted />
            <MoneyRow label="Argent vraiment utilisable" value={formatMoney(safeAvailable)} strong />
          </div>
        </div>
      </Card>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric
          comparison={monthComparison(monthCash.grossAmountCents, previousMonthCash.grossAmountCents)}
          icon={WalletCards}
          label="CA du mois"
          value={formatMoney(monthCash.grossAmountCents)}
        />
        <Metric
          comparison={monthComparison(monthCash.recommendedReserveCents, previousMonthCash.recommendedReserveCents)}
          icon={ShieldCheck}
          label="À mettre de côté"
          value={formatMoney(monthCash.recommendedReserveCents)}
        />
        <Metric
          comparison={monthComparison(quarterCash.grossAmountCents, previousMonthCash.grossAmountCents)}
          icon={Gauge}
          label="CA du trimestre"
          value={formatMoney(quarterCash.grossAmountCents)}
        />
        <Metric
          comparison={monthComparison(
            annualProjection.projectedAnnualRevenueCents,
            previousMonthCash.grossAmountCents * 12
          )}
          icon={TrendingUp}
          label="Projection annuelle"
          value={formatMoney(annualProjection.projectedAnnualRevenueCents)}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <ModuleTitle icon={BadgeEuro} label="Mode salaire" title="Mon salaire prudent" />
          <form className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              className="min-h-10 flex-1 rounded-[6px] border border-[#d8dfe8] px-3 py-2 text-sm"
              defaultValue={params.salary ?? "1800"}
              min="0"
              name="salary"
              type="number"
            />
            <input name="spend" type="hidden" value={params.spend ?? "1499"} />
            <input name="days" type="hidden" value={params.days ?? "18"} />
            <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[6px] bg-[#0c8c5e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#08764f]" type="submit">
              Calculer
            </button>
          </form>
          <p className="mt-5 text-sm text-[#50617a]">Pour te verser {formatMoney(salary.targetAvailableCents)} utilisables, vise environ :</p>
          <p className="mt-1 text-3xl font-semibold text-[#061b31]">{formatMoney(salary.grossRevenueNeededCents)} de CA</p>
          <ProgressBar value={salary.progressPercent} className="mt-5" />
          <div className="mt-3 flex items-center justify-between gap-4 text-sm text-[#50617a]">
            <span>Déjà encaissé : {formatMoney(monthCash.grossAmountCents)}</span>
            <span>{formatPercent(salary.progressPercent, 0)}</span>
          </div>
          <p className="mt-3 text-sm font-medium text-[#061b31]">Reste à encaisser : {formatMoney(salary.remainingRevenueCents)}</p>
        </Card>

        <Card>
          <ModuleTitle icon={ShoppingBag} label="Décision" title="Je peux acheter ça ?" />
          <form className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              className="min-h-10 flex-1 rounded-[6px] border border-[#d8dfe8] px-3 py-2 text-sm"
              defaultValue={params.spend ?? "1499"}
              min="0"
              name="spend"
              type="number"
            />
            <input name="salary" type="hidden" value={params.salary ?? "1800"} />
            <input name="days" type="hidden" value={params.days ?? "18"} />
            <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[6px] border border-[#d8dfe8] bg-white px-4 py-2 text-sm font-semibold text-[#061b31] hover:bg-[#f8fafd]" type="submit">
              Tester
            </button>
          </form>
          <div className="mt-5">
            <SignalLine signal={spendDecision.signal} title={spendDecision.decision} text={spendDecision.explanation} />
            {spendDecision.additionalGrossRevenueNeededCents > 0 ? (
              <p className="mt-4 text-sm leading-6 text-[#50617a]">
                Option prudente : encaisse encore {formatMoney(spendDecision.additionalGrossRevenueNeededCents)}
                {spendDecision.availableFromDate ? ` ou attends autour du ${formatShortDate(spendDecision.availableFromDate)} à ton rythme actuel.` : "."}
              </p>
            ) : (
              <p className="mt-4 text-sm leading-6 text-[#50617a]">
                Après achat, marge estimée : {formatMoney(Math.max(0, spendDecision.marginAfterSpendCents))}.
              </p>
            )}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card>
          <ModuleTitle icon={ShieldCheck} label="Réserve" title="Stress test indépendant" />
          <p className="mt-4 text-sm text-[#50617a]">Si tu n'encaisses plus rien, tu tiens environ :</p>
          <p className="mt-1 text-3xl font-semibold text-[#061b31]">{stress.runwayDays} jours</p>
          <div className="mt-4 divide-y divide-[#d8dfe8] text-sm">
            <MoneyRow label="Après 30 jours" value={formatMoney(stress.balanceAfter30DaysCents)} />
            <MoneyRow label="Après 60 jours" value={formatMoney(stress.balanceAfter60DaysCents)} />
            <MoneyRow label="Réserve cible 3 mois" value={formatMoney(stress.recommendedReserveCents)} strong />
          </div>
          <p className="mt-4 text-sm font-medium text-[#061b31]">Manque pour être serein : {formatMoney(stress.missingReserveCents)}</p>
        </Card>

        <Card>
          <ModuleTitle icon={Gauge} label="Radar seuils" title="Ce qui peut changer ton cash" />
          <div className="mt-4 space-y-5">
            <ThresholdLine label="Franchise TVA" remaining={vatRemainingCents} usage={vat.usagePercent} />
            <ThresholdLine label="Seuil micro" remaining={microRemainingCents} usage={threshold.usagePercent} />
          </div>
          <p className="mt-5 text-sm leading-6 text-[#50617a]">
            À ton rythme actuel, AutoNet projette {formatMoney(annualProjection.projectedAnnualRevenueCents)} cette année.
          </p>
          {nextPeriod ? (
            <Link className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#0c8c5e] hover:text-[#08764f]" href={`/app/declarations/${nextPeriod.id}`}>
              Prochaine déclaration : {nextPeriod.label}, {formatShortDate(nextPeriod.dueDate)}
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
          ) : null}
        </Card>

        <Card>
          <ModuleTitle icon={Calculator} label="Prix minimum" title="Tarif rentable" />
          <form className="mt-4 flex items-center gap-3">
            <input name="salary" type="hidden" value={params.salary ?? "1800"} />
            <input name="spend" type="hidden" value={params.spend ?? "1499"} />
            <input
              className="min-h-10 w-28 rounded-[6px] border border-[#d8dfe8] px-3 py-2 text-sm"
              defaultValue={params.days ?? "18"}
              min="1"
              name="days"
              type="number"
            />
            <span className="text-sm text-[#50617a]">jours facturables</span>
            <button className="ml-auto inline-flex min-h-10 items-center justify-center rounded-[6px] border border-[#d8dfe8] bg-white px-3 text-sm font-semibold hover:bg-[#f8fafd]" type="submit">
              OK
            </button>
          </form>
          <div className="mt-5 divide-y divide-[#d8dfe8]">
            <MoneyRow label="Minimum" value={`${formatMoney(pricing.minimumDailyRateCents)} / jour`} />
            <MoneyRow label="Prudent" value={`${formatMoney(pricing.prudentDailyRateCents)} / jour`} strong />
            <MoneyRow label="Ambitieux" value={`${formatMoney(pricing.ambitiousDailyRateCents)} / jour`} />
          </div>
          <p className="mt-4 text-sm text-[#50617a]">
            À {formatMoney(averageSaleCents)} par vente, il faut environ {pricing.salesNeeded ?? 0} ventes pour atteindre ton revenu prudent.
          </p>
        </Card>
      </div>

      <Card className="mt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <ModuleTitle icon={WalletCards} label="Historique" title="Derniers encaissements" />
          <Link className="inline-flex items-center gap-2 text-sm font-semibold text-[#0c8c5e] hover:text-[#08764f]" href="/app/entries">
            Tout voir
            <ArrowRight aria-hidden className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="text-left text-[#64748d]">
              <tr>
                <th className="py-2 font-medium">Date</th>
                <th className="font-medium">Client</th>
                <th className="font-medium">Brut</th>
                <th className="font-medium">À réserver</th>
                <th className="font-medium">Disponible</th>
              </tr>
            </thead>
            <tbody>
              {entries.slice(0, 6).map((entry) => (
                <tr className="border-t border-[#eef4f8]" key={entry.id}>
                  <td className="py-3">{formatShortDate(entry.collectionDate)}</td>
                  <td>{entry.clientName ?? "Sans client"}</td>
                  <td>{formatMoney(entry.grossAmountCents)}</td>
                  <td>{formatMoney(entry.estimatedReserveCents)}</td>
                  <td className="font-semibold text-[#0c8c5e]">{formatMoney(entry.estimatedAvailableCents)}</td>
                </tr>
              ))}
              {!entries.length ? (
                <tr>
                  <td className="py-6 text-center text-[#64748d]" colSpan={5}>
                    Aucun encaissement pour l'instant.
                  </td>
                </tr>
              ) : null}
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
  comparison,
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
      {comparison ? (
        <p className={`mt-2 text-xs font-semibold ${comparisonToneClassName[comparison.tone]}`}>
          {comparison.label}
        </p>
      ) : null}
    </Card>
  );
}

function ModuleTitle({
  icon: Icon,
  label,
  title,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  title: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm font-semibold text-[#0c8c5e]">
        <Icon aria-hidden className="h-4 w-4" />
        {label}
      </div>
      <h2 className="mt-1 text-lg font-semibold text-[#061b31]">{title}</h2>
    </div>
  );
}

function MoneyRow({ label, value, strong, muted }: { label: string; value: string; strong?: boolean; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 text-sm">
      <span className="text-[#50617a]">{label}</span>
      <span className={`text-right tabular-nums ${strong ? "text-base font-semibold text-[#061b31]" : muted ? "text-[#64748d]" : "font-medium text-[#061b31]"}`}>
        {value}
      </span>
    </div>
  );
}

function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={`h-3 overflow-hidden rounded-[6px] bg-[#eef4f8] ${className ?? ""}`}>
      <div className="h-full rounded-[6px] bg-[#0c8c5e]" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

function SignalLine({ signal, title, text }: { signal: DecisionSignal; title: string; text: string }) {
  const config = signalConfig[signal];
  return (
    <div className="flex gap-3">
      <config.icon aria-hidden className={`mt-0.5 h-5 w-5 ${config.iconColor}`} />
      <div>
        <p className="font-semibold text-[#061b31]">{title}</p>
        <p className="mt-1 text-sm leading-6 text-[#50617a]">{text}</p>
      </div>
    </div>
  );
}

function ThresholdLine({ label, remaining, usage }: { label: string; remaining: number; usage: number }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="font-medium text-[#061b31]">{label}</span>
        <span className="text-[#50617a]">{formatMoney(remaining)} de marge</span>
      </div>
      <ProgressBar value={usage} className="mt-2" />
      <p className="mt-1 text-xs text-[#64748d]">{formatPercent(usage)}</p>
    </div>
  );
}

function getCockpitSignal(
  salarySignal: DecisionSignal,
  reserveStatus: "ENOUGH" | "MISSING" | "OVER_RESERVED",
  microRisk: string,
  vatRisk: string
): DecisionSignal {
  if (microRisk === "EXCEEDED" || vatRisk === "EXCEEDED") return "RED";
  if (reserveStatus === "MISSING" || microRisk === "WARNING" || vatRisk === "WARNING") return "ORANGE";
  return salarySignal;
}

function monthComparison(currentCents: number, previousCents: number) {
  if (previousCents === 0) {
    return {
      label: currentCents > 0 ? "Nouveau vs mois dernier" : "Stable vs mois dernier",
      tone: currentCents > 0 ? "positive" : "neutral",
    } as const;
  }
  const percent = ((currentCents - previousCents) / Math.abs(previousCents)) * 100;
  return {
    label: `${percent >= 0 ? "+" : ""}${formatPercent(percent, 0)} vs mois dernier`,
    tone: percent >= 0 ? "positive" : "negative",
  } as const;
}

const comparisonToneClassName = {
  positive: "text-[#0c8c5e]",
  negative: "text-red-700",
  neutral: "text-[#64748d]",
};

const signalConfig = {
  GREEN: {
    label: "Feu vert financier",
    border: "border-l-[#0c8c5e]",
    badge: "bg-emerald-50 text-emerald-800",
    bgTint: "bg-gradient-to-br from-emerald-50/50 to-white",
    iconColor: "text-[#0c8c5e]",
    icon: CircleCheck,
  },
  ORANGE: {
    label: "Zone orange",
    border: "border-l-[#b76e00]",
    badge: "bg-amber-50 text-amber-900",
    bgTint: "bg-gradient-to-br from-amber-50/50 to-white",
    iconColor: "text-[#b76e00]",
    icon: CircleAlert,
  },
  RED: {
    label: "À sécuriser",
    border: "border-l-red-700",
    badge: "bg-red-50 text-red-800",
    bgTint: "bg-gradient-to-br from-red-50/50 to-white",
    iconColor: "text-red-700",
    icon: CircleAlert,
  },
} satisfies Record<
  DecisionSignal,
  {
    label: string;
    border: string;
    badge: string;
    bgTint: string;
    iconColor: string;
    icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  }
>;
