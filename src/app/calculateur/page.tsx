import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeEuro, Calculator, CheckCircle2, ShieldCheck, WalletCards } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ACTIVITY_CATEGORIES, ActivityCategory, activityLabels } from "@/domain/activity";
import { formatMoney, eurosToCents } from "@/domain/formatting/format";
import { getRulesForYear, LEGAL_DISCLAIMER } from "@/domain/rules/default-rules";
import { simulateAvailableFromGross, simulateGrossNeededForTargetNet } from "@/domain/simulator/simulator";

export const metadata: Metadata = {
  title: "Calculateur auto-entrepreneur gratuit | AutoNet",
  description:
    "Calculez combien garder après un encaissement auto-entrepreneur : cotisations, impôt optionnel, réserve prudente et argent vraiment disponible.",
};

type CalculatorParams = {
  gross?: string;
  target?: string;
  activity?: string;
  tax?: string;
};

const rules = getRulesForYear(2026);

export default async function PublicCalculatorPage({
  searchParams,
}: {
  searchParams?: Promise<CalculatorParams>;
}) {
  const params = (await searchParams) ?? {};
  const activityCategory = parseActivity(params.activity);
  const taxWithholdingEnabled = params.tax === "on";
  const profile = {
    taxWithholdingEnabled,
    conservativeReserveBufferRate: 0.05,
  };
  const grossValue = params.gross ?? "3000";
  const targetValue = params.target ?? "1800";
  const gross = simulateAvailableFromGross({
    grossAmountCents: eurosToCents(grossValue),
    activityCategory,
    taxWithholdingEnabled,
    conservativeReserveBufferRate: profile.conservativeReserveBufferRate,
    rules,
  });
  const target = simulateGrossNeededForTargetNet({
    targetAvailableCents: eurosToCents(targetValue),
    activityCategory,
    profile,
    rules,
  });

  return (
    <main className="min-h-screen bg-[#f8fafd] text-[#061b31]">
      <header className="border-b border-[#d8dfe8] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 text-lg font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#0c8c5e] text-xs text-white">
              AN
            </span>
            AutoNet
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link className="hidden text-[#50617a] hover:text-[#061b31] sm:inline" href="/#prix">
              Prix
            </Link>
            <ButtonLink href="/login" variant="secondary">
              Connexion
            </ButtonLink>
          </nav>
        </div>
      </header>

      <section className="border-b border-[#d8dfe8] bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1fr] lg:px-8">
          <div>
            <p className="text-sm font-semibold text-[#0c8c5e]">Calculateur auto-entrepreneur gratuit</p>
            <h1 className="mt-4 text-4xl font-semibold text-[#061b31] sm:text-5xl">
              J'encaisse X, je garde combien ?
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#50617a]">
              Entre ton chiffre d'affaires encaissé. AutoNet estime quoi mettre de côté et combien devient vraiment utilisable.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm text-[#50617a]">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 aria-hidden className="h-4 w-4 text-[#0c8c5e]" />
                Sans inscription
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 aria-hidden className="h-4 w-4 text-[#0c8c5e]" />
                Résultat immédiat
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 aria-hidden className="h-4 w-4 text-[#0c8c5e]" />
                Version 2026
              </span>
            </div>
          </div>

          <Card className="border-[#0c8c5e]/30">
            <form className="grid gap-4">
              <label className="space-y-1.5 text-sm font-medium text-[#061b31]">
                <span>Chiffre d'affaires encaissé ce mois-ci</span>
                <input
                  className="w-full rounded-[6px] border border-[#d8dfe8] px-3 py-2 text-sm"
                  defaultValue={grossValue}
                  min="0"
                  name="gross"
                  type="number"
                />
              </label>
              <label className="space-y-1.5 text-sm font-medium text-[#061b31]">
                <span>Activité</span>
                <select
                  className="w-full rounded-[6px] border border-[#d8dfe8] px-3 py-2 text-sm"
                  defaultValue={activityCategory}
                  name="activity"
                >
                  {ACTIVITY_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {activityLabels[category]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-3 rounded-[6px] border border-[#d8dfe8] bg-[#f8fafd] px-3 py-2 text-sm text-[#50617a]">
                <input defaultChecked={taxWithholdingEnabled} name="tax" type="checkbox" />
                Versement libératoire de l'impôt activé
              </label>
              <button
                className="inline-flex min-h-10 items-center justify-center rounded-[6px] bg-[#0c8c5e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#08764f]"
                type="submit"
              >
                Calculer mon vrai disponible
              </button>
            </form>
          </Card>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_0.85fr] lg:px-8">
        <Card>
          <ModuleTitle icon={WalletCards} label="Résultat" title="Ton argent vraiment utilisable" />
          <div className="mt-5 divide-y divide-[#d8dfe8]">
            <ResultLine label="Tu as encaissé" value={formatMoney(gross.grossAmountCents)} />
            <ResultLine
              label="À réserver URSSAF + formation"
              value={formatMoney(gross.socialContributionEstimateCents + gross.trainingContributionEstimateCents)}
            />
            <ResultLine label="À réserver impôt" value={formatMoney(gross.taxWithholdingEstimateCents)} />
            <ResultLine label="Marge prudente recommandée" value={formatMoney(gross.conservativeBufferCents)} />
            <ResultLine label="Réserve totale recommandée" value={formatMoney(gross.recommendedReserveCents)} />
            <ResultLine label="Argent vraiment utilisable" value={formatMoney(gross.estimatedAvailableCents)} strong />
          </div>
          <div className="mt-5 rounded-[6px] bg-[#eef4f8] p-4 text-sm leading-6 text-[#50617a]">
            Si tu dépenses plus que {formatMoney(gross.estimatedAvailableCents)}, tu fragilises l'argent à réserver pour ta prochaine déclaration.
          </div>
        </Card>

        <div className="grid gap-6">
          <Card>
            <ModuleTitle icon={BadgeEuro} label="Mode salaire" title="Je veux me verser X" />
            <form className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
              <input name="gross" type="hidden" value={grossValue} />
              <input name="activity" type="hidden" value={activityCategory} />
              {taxWithholdingEnabled ? <input name="tax" type="hidden" value="on" /> : null}
              <input
                className="min-h-10 rounded-[6px] border border-[#d8dfe8] px-3 py-2 text-sm"
                defaultValue={targetValue}
                min="0"
                name="target"
                type="number"
              />
              <button
                className="inline-flex min-h-10 items-center justify-center rounded-[6px] border border-[#d8dfe8] bg-white px-4 py-2 text-sm font-semibold hover:bg-[#f8fafd]"
                type="submit"
              >
                Calculer
              </button>
            </form>
            <p className="mt-5 text-sm text-[#50617a]">Pour te verser {formatMoney(target.estimatedAvailableCents)} utilisables, vise environ :</p>
            <p className="mt-1 text-3xl font-semibold">{formatMoney(target.grossRevenueNeededCents)} de CA</p>
            <p className="mt-3 text-sm leading-6 text-[#50617a]">
              AutoNet réserverait {formatMoney(target.recommendedReserveCents)} avant de considérer ce revenu comme à toi.
            </p>
          </Card>

          <Card className="border-[#2f6fed]/40">
            <ModuleTitle icon={ShieldCheck} label="Compte gratuit" title="Voir le détail complet" />
            <p className="mt-3 text-sm leading-6 text-[#50617a]">
              En compte gratuit, tu suis tes encaissements, ton historique, tes seuils et ton argent disponible mois après mois.
            </p>
            <ButtonLink className="mt-5" href="/register">
              Créer un compte gratuit
              <ArrowRight aria-hidden className="h-4 w-4" />
            </ButtonLink>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="rounded-[8px] border border-[#d8dfe8] bg-white p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-[#2f6fed]">
                <Calculator aria-hidden className="h-4 w-4" />
                100 places Lifetime bêta
              </div>
              <p className="mt-1 text-sm leading-6 text-[#50617a]">
                Accès Pro bêta à vie pour 79 €. Idéal si AutoNet devient ton cockpit mensuel.
              </p>
            </div>
            <ButtonLink href="/register" variant="secondary">
              Réserver ma place
            </ButtonLink>
          </div>
        </div>
        <p className="mt-5 text-xs leading-5 text-[#64748d]">{LEGAL_DISCLAIMER}</p>
      </section>
    </main>
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

function parseActivity(value: string | undefined): ActivityCategory {
  if (ACTIVITY_CATEGORIES.includes(value as ActivityCategory)) {
    return value as ActivityCategory;
  }
  return "SERVICE_BNC";
}
