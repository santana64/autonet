import { ArrowRight, BadgeEuro, Calculator, ShoppingBag, WalletCards } from "lucide-react";
import { Card, SectionHeader } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { activityLabels } from "@/domain/activity";
import { planAllows } from "@/domain/billing/plans";
import { formatMoney, formatShortDate, eurosToCents } from "@/domain/formatting/format";
import {
  calculateMinimumPricing,
  evaluateSpendDecision,
  simulateAvailableFromGross,
  simulateGrossNeededForTargetNet,
} from "@/domain/simulator/simulator";
import { getRulesForYear } from "@/domain/rules/default-rules";
import { requireUser } from "@/lib/auth";
import { getUserPlan } from "@/lib/plans";
import { prisma } from "@/lib/prisma";

export default async function SimulatorPage({
  searchParams,
}: {
  searchParams?: Promise<{
    gross?: string;
    target?: string;
    spend?: string;
    balance?: string;
    reserved?: string;
    due?: string;
    activity?: string;
    days?: string;
    sale?: string;
  }>;
}) {
  const user = await requireUser();
  const params = (await searchParams) ?? {};
  const [profile, plan] = await Promise.all([
    prisma.businessProfile.findUniqueOrThrow({ where: { userId: user.id } }),
    getUserPlan(user.id),
  ]);
  const rules = getRulesForYear(profile.contributionRulesYear);
  const activityCategory = (params.activity ?? profile.mainActivityCategory) as typeof profile.mainActivityCategory;
  const cashProfile = {
    taxWithholdingEnabled: profile.taxWithholdingEnabled,
    conservativeReserveBufferRate: Number(profile.conservativeReserveBufferRate),
  };
  const gross = simulateAvailableFromGross({
    grossAmountCents: eurosToCents(params.gross ?? "3000"),
    activityCategory,
    taxWithholdingEnabled: cashProfile.taxWithholdingEnabled,
    conservativeReserveBufferRate: cashProfile.conservativeReserveBufferRate,
    rules,
  });
  const target = simulateGrossNeededForTargetNet({
    targetAvailableCents: eurosToCents(params.target ?? "1800"),
    activityCategory,
    profile: cashProfile,
    rules,
  });
  const advanced = planAllows(plan, "advancedSimulator");
  const balanceCents = eurosToCents(params.balance ?? "3000");
  const reservedCents = eurosToCents(params.reserved ?? "700");
  const dueCents = eurosToCents(params.due ?? "700");
  const safeAvailableCents = Math.max(0, balanceCents - Math.max(0, dueCents - reservedCents));
  const spendDecision = advanced
    ? evaluateSpendDecision({
        desiredSpendCents: eurosToCents(params.spend ?? "500"),
        safeAvailableCents,
        activityCategory,
        profile: cashProfile,
        rules,
      })
    : null;
  const pricing = advanced
    ? calculateMinimumPricing({
        targetAvailableCents: eurosToCents(params.target ?? "1800"),
        billableDays: Number.parseInt(params.days ?? "18", 10),
        averageSaleCents: eurosToCents(params.sale ?? "150"),
        activityCategory,
        profile: cashProfile,
        rules,
      })
    : null;

  return (
    <>
      <SectionHeader
        action={
          <ButtonLink href="/app/billing" variant="secondary">
            Voir les offres
            <ArrowRight aria-hidden className="h-4 w-4" />
          </ButtonLink>
        }
        description="Pose une question simple à ton activité : combien je garde, combien encaisser, est-ce que cet achat est prudent."
        title="Simulateur de décision"
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Card>
          <ModuleTitle icon={WalletCards} label="Cash disponible" title="J'encaisse X, je garde combien ?" />
          <form className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <input className="min-h-10 rounded-[6px] border border-[#d8dfe8] px-3 py-2 text-sm" defaultValue={params.gross ?? "3000"} min="0" name="gross" type="number" />
            <select className="min-h-10 rounded-[6px] border border-[#d8dfe8] px-3 py-2 text-sm" defaultValue={activityCategory} name="activity">
              {Object.entries(activityLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            <button className="inline-flex min-h-10 items-center justify-center rounded-[6px] bg-[#0c8c5e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#08764f]" type="submit">
              Calculer
            </button>
          </form>
          <div className="mt-5 divide-y divide-[#d8dfe8]">
            <ResultLine label="Brut encaissé" value={formatMoney(gross.grossAmountCents)} />
            <ResultLine label="URSSAF + formation" value={formatMoney(gross.socialContributionEstimateCents + gross.trainingContributionEstimateCents)} />
            <ResultLine label="Impôt estimé" value={formatMoney(gross.taxWithholdingEstimateCents)} />
            <ResultLine label="Réserve recommandée" value={formatMoney(gross.recommendedReserveCents)} />
            <ResultLine label="Argent utilisable" value={formatMoney(gross.estimatedAvailableCents)} strong />
          </div>
        </Card>

        <Card>
          <ModuleTitle icon={BadgeEuro} label="Mode salaire" title="Je veux me verser X" />
          <form className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
            <input className="min-h-10 rounded-[6px] border border-[#d8dfe8] px-3 py-2 text-sm" defaultValue={params.target ?? "1800"} min="0" name="target" type="number" />
            <input name="activity" type="hidden" value={activityCategory} />
            <button className="inline-flex min-h-10 items-center justify-center rounded-[6px] bg-[#0c8c5e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#08764f]" type="submit">
              Calculer
            </button>
          </form>
          <p className="mt-5 text-sm text-[#50617a]">Pour te verser {formatMoney(target.estimatedAvailableCents)} utilisables, tu dois encaisser environ :</p>
          <p className="mt-1 text-3xl font-semibold text-[#061b31]">{formatMoney(target.grossRevenueNeededCents)}</p>
          <p className="mt-3 text-sm text-[#50617a]">
            AutoNet réserverait environ {formatMoney(target.recommendedReserveCents)} avant de considérer ce revenu comme à toi.
          </p>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <ModuleTitle icon={ShoppingBag} label="Pro" title="Je peux acheter ça ?" />
          {advanced ? (
            <>
              <form className="mt-4 grid gap-3 md:grid-cols-2">
                <input className="min-h-10 rounded-[6px] border border-[#d8dfe8] px-3 py-2 text-sm" defaultValue={params.spend ?? "500"} min="0" name="spend" placeholder="Dépense" type="number" />
                <input className="min-h-10 rounded-[6px] border border-[#d8dfe8] px-3 py-2 text-sm" defaultValue={params.balance ?? "3000"} min="0" name="balance" placeholder="Solde banque" type="number" />
                <input className="min-h-10 rounded-[6px] border border-[#d8dfe8] px-3 py-2 text-sm" defaultValue={params.reserved ?? "700"} min="0" name="reserved" placeholder="Déjà réservé" type="number" />
                <input className="min-h-10 rounded-[6px] border border-[#d8dfe8] px-3 py-2 text-sm" defaultValue={params.due ?? "700"} min="0" name="due" placeholder="À provisionner" type="number" />
                <input name="activity" type="hidden" value={activityCategory} />
                <button className="inline-flex min-h-10 items-center justify-center rounded-[6px] border border-[#d8dfe8] bg-white px-4 py-2 text-sm font-semibold hover:bg-[#f8fafd]" type="submit">
                  Tester
                </button>
              </form>
              {spendDecision ? (
                <div className="mt-5">
                  <p className="text-sm text-[#64748d]">Décision</p>
                  <p className="mt-1 text-2xl font-semibold text-[#061b31]">{spendDecision.decision}</p>
                  <p className="mt-2 text-sm leading-6 text-[#50617a]">{spendDecision.explanation}</p>
                  <p className="mt-3 text-sm font-medium">Disponible prudent : {formatMoney(spendDecision.safeAvailableCents)}</p>
                  {spendDecision.additionalGrossRevenueNeededCents > 0 ? (
                    <p className="mt-2 text-sm text-[#50617a]">
                      Encaisse encore {formatMoney(spendDecision.additionalGrossRevenueNeededCents)}
                      {spendDecision.availableFromDate ? ` ou attends autour du ${formatShortDate(spendDecision.availableFromDate)}.` : "."}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : (
            <UpgradeCopy />
          )}
        </Card>

        <Card>
          <ModuleTitle icon={Calculator} label="Pro" title="Prix minimum rentable" />
          {advanced && pricing ? (
            <>
              <form className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                <input className="min-h-10 rounded-[6px] border border-[#d8dfe8] px-3 py-2 text-sm" defaultValue={params.days ?? "18"} min="1" name="days" placeholder="Jours" type="number" />
                <input className="min-h-10 rounded-[6px] border border-[#d8dfe8] px-3 py-2 text-sm" defaultValue={params.sale ?? "150"} min="0" name="sale" placeholder="Prix vente" type="number" />
                <input name="target" type="hidden" value={params.target ?? "1800"} />
                <input name="activity" type="hidden" value={activityCategory} />
                <button className="inline-flex min-h-10 items-center justify-center rounded-[6px] border border-[#d8dfe8] bg-white px-4 py-2 text-sm font-semibold hover:bg-[#f8fafd]" type="submit">
                  Calculer
                </button>
              </form>
              <div className="mt-5 divide-y divide-[#d8dfe8]">
                <ResultLine label="Prix journalier minimum" value={`${formatMoney(pricing.minimumDailyRateCents)} / jour`} />
                <ResultLine label="Prix recommandé prudent" value={`${formatMoney(pricing.prudentDailyRateCents)} / jour`} strong />
                <ResultLine label="Prix ambitieux" value={`${formatMoney(pricing.ambitiousDailyRateCents)} / jour`} />
                <ResultLine label="Nombre de ventes nécessaires" value={`${pricing.salesNeeded ?? 0}`} />
              </div>
            </>
          ) : (
            <UpgradeCopy />
          )}
        </Card>
      </div>
    </>
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

function ResultLine({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 text-sm">
      <span className="text-[#50617a]">{label}</span>
      <span className={`text-right tabular-nums ${strong ? "text-base font-semibold text-[#0c8c5e]" : "font-medium text-[#061b31]"}`}>
        {value}
      </span>
    </div>
  );
}

function UpgradeCopy() {
  return (
    <div className="mt-4">
      <p className="rounded-[6px] border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
        Disponible en Pro : décisions d'achat, scénarios et pricing prudent pour piloter ton argent avant de le dépenser.
      </p>
      <ButtonLink className="mt-4" href="/app/billing">
        Passer à Pro
        <ArrowRight aria-hidden className="h-4 w-4" />
      </ButtonLink>
    </div>
  );
}
