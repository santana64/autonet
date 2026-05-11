import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeEuro, CheckCircle2, ShieldCheck, WalletCards } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogoMark } from "@/components/ui/logo";
import { EmailCapture } from "@/components/calculateur/email-capture";
import { ACTIVITY_CATEGORIES, ActivityCategory, activityLabels } from "@/domain/activity";
import { formatMoney, eurosToCents } from "@/domain/formatting/format";
import { getRulesForYear, LEGAL_DISCLAIMER } from "@/domain/rules/default-rules";
import { simulateAvailableFromGross, simulateGrossNeededForTargetNet } from "@/domain/simulator/simulator";

export const metadata: Metadata = {
  title: "Calculateur auto-entrepreneur gratuit 2026 | AutoNet",
  description:
    "Calculez combien garder après un encaissement auto-entrepreneur : cotisations URSSAF, impôt optionnel, réserve prudente et argent vraiment disponible.",
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
  const profile = { taxWithholdingEnabled, conservativeReserveBufferRate: 0.05 };
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
    <main className="min-h-screen bg-[#f8fafb] text-[#0a0f1a]">
      {/* Header */}
      <header className="border-b border-[#e2e8f0] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <Link href="/" className="flex items-center gap-2.5 text-[15px] font-bold tracking-[-0.02em] text-[#0a0f1a]">
            <LogoMark size={30} />
            AutoNet
          </Link>
          <nav className="flex items-center gap-1">
            <Link className="hidden rounded-full px-3 py-1.5 text-[13px] font-medium text-[#64748b] transition hover:bg-[#f1f5f9] hover:text-[#0a0f1a] sm:inline-flex" href="/#prix">
              Tarifs
            </Link>
            <ButtonLink href="/login" variant="secondary" className="text-[13px]">
              Connexion
            </ButtonLink>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-[#e2e8f0] bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 lg:grid-cols-[1fr_0.9fr] lg:py-16">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#0c8c5e]">
              Calculateur gratuit — version 2026
            </p>
            <h1 className="mt-4 text-[36px] font-black leading-[1.1] tracking-[-0.03em] text-[#0a0f1a] sm:text-[44px]">
              J'encaisse X,<br />je garde combien ?
            </h1>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[#64748b]">
              Entre ton chiffre d'affaires encaissé. AutoNet calcule quoi mettre de côté et combien devient vraiment utilisable.
            </p>
            <div className="mt-5 flex flex-wrap gap-4 text-[13px] text-[#64748b]">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 aria-hidden className="h-4 w-4 text-[#0c8c5e]" />
                Sans inscription
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 aria-hidden className="h-4 w-4 text-[#0c8c5e]" />
                Résultat immédiat
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 aria-hidden className="h-4 w-4 text-[#0c8c5e]" />
                Taux officiels 2026
              </span>
            </div>
          </div>

          <Card className="border-[#0c8c5e]/25">
            <form className="grid gap-4">
              <label className="space-y-1.5">
                <span className="text-[13px] font-semibold text-[#0a0f1a]">CA encaissé ce mois-ci (€)</span>
                <input
                  className="h-9 w-full rounded-full border border-[#e2e8f0] bg-[#f8fafb] px-4 text-[14px] text-[#0a0f1a] outline-none focus:border-[#0c8c5e]/50 focus:ring-2 focus:ring-[#0c8c5e]/15"
                  defaultValue={grossValue}
                  min="0"
                  name="gross"
                  type="number"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-[13px] font-semibold text-[#0a0f1a]">Type d'activité</span>
                <select
                  className="h-9 w-full rounded-full border border-[#e2e8f0] bg-[#f8fafb] px-4 text-[14px] text-[#0a0f1a] outline-none focus:border-[#0c8c5e]/50 focus:ring-2 focus:ring-[#0c8c5e]/15"
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
              <label className="flex cursor-pointer items-center gap-3 rounded-full border border-[#e2e8f0] bg-[#f8fafb] px-4 py-2.5 text-[13px] text-[#64748b]">
                <input defaultChecked={taxWithholdingEnabled} name="tax" type="checkbox" value="on" className="accent-[#0c8c5e]" />
                Versement libératoire de l'impôt activé
              </label>
              <button
                className="h-9 w-full rounded-full bg-[#0c8c5e] text-[13px] font-semibold text-white transition hover:bg-[#08764f] active:scale-[0.98]"
                type="submit"
              >
                Calculer mon vrai disponible
              </button>
            </form>
          </Card>
        </div>
      </section>

      {/* Results */}
      <section className="mx-auto grid max-w-6xl gap-5 px-5 py-8 lg:grid-cols-[1fr_0.85fr]">
        <Card>
          <ModuleTitle icon={WalletCards} label="Résultat" title="Ton argent vraiment utilisable" />
          <div className="mt-5 divide-y divide-[#e2e8f0]">
            <ResultLine label="Tu as encaissé" value={formatMoney(gross.grossAmountCents)} />
            <ResultLine
              label="À réserver URSSAF + formation"
              value={formatMoney(gross.socialContributionEstimateCents + gross.trainingContributionEstimateCents)}
            />
            {gross.taxWithholdingEstimateCents > 0 && (
              <ResultLine label="À réserver impôt (VL)" value={formatMoney(gross.taxWithholdingEstimateCents)} />
            )}
            <ResultLine label="Marge prudente (+5%)" value={formatMoney(gross.conservativeBufferCents)} />
            <ResultLine label="Réserve totale à bloquer" value={formatMoney(gross.recommendedReserveCents)} />
            <ResultLine label="Disponible réel" value={formatMoney(gross.estimatedAvailableCents)} strong />
          </div>
          <div className="mt-4 rounded-full bg-[#f1f5f9] px-4 py-2.5 text-[13px] leading-relaxed text-[#64748b]">
            Si tu dépenses plus que <strong className="text-[#0a0f1a]">{formatMoney(gross.estimatedAvailableCents)}</strong>, tu fragilises ta prochaine déclaration.
          </div>
        </Card>

        <div className="flex flex-col gap-5">
          <Card>
            <ModuleTitle icon={BadgeEuro} label="Mode salaire" title="Je veux me verser X" />
            <form className="mt-4 flex gap-2">
              <input name="gross" type="hidden" value={grossValue} />
              <input name="activity" type="hidden" value={activityCategory} />
              {taxWithholdingEnabled && <input name="tax" type="hidden" value="on" />}
              <input
                className="h-9 flex-1 rounded-full border border-[#e2e8f0] bg-[#f8fafb] px-4 text-[13px] outline-none focus:border-[#0c8c5e]/50 focus:ring-2 focus:ring-[#0c8c5e]/15"
                defaultValue={targetValue}
                min="0"
                name="target"
                type="number"
              />
              <button
                className="h-9 shrink-0 rounded-full border border-[#e2e8f0] bg-white px-4 text-[13px] font-semibold transition hover:bg-[#f1f5f9]"
                type="submit"
              >
                OK
              </button>
            </form>
            <p className="mt-4 text-[13px] text-[#64748b]">
              Pour te verser <strong className="text-[#0a0f1a]">{formatMoney(target.estimatedAvailableCents)}</strong> utilisables, vise :
            </p>
            <p className="mt-1 text-[32px] font-black tracking-[-0.025em] text-[#0a0f1a]">
              {formatMoney(target.grossRevenueNeededCents)} de CA
            </p>
            <p className="mt-2 text-[12px] leading-relaxed text-[#94a3b8]">
              AutoNet réserverait {formatMoney(target.recommendedReserveCents)} avant de considérer cet argent comme à toi.
            </p>
          </Card>

          {/* Email capture */}
          <EmailCapture />

          <Card>
            <ModuleTitle icon={ShieldCheck} label="Compte gratuit" title="Suivre chaque mois" />
            <p className="mt-2 text-[13px] leading-relaxed text-[#64748b]">
              Enregistre tes encaissements, suis ta réserve URSSAF, tes seuils TVA et ton disponible réel mois après mois.
            </p>
            <ButtonLink className="mt-4 w-full justify-center" href="/register">
              Créer un compte gratuit
              <ArrowRight aria-hidden className="h-4 w-4" />
            </ButtonLink>
          </Card>
        </div>
      </section>

      {/* Lifetime banner */}
      <section className="mx-auto max-w-6xl px-5 pb-10">
        <div className="flex flex-col gap-4 rounded-[10px] border border-[#e2e8f0] bg-white p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[13px] font-semibold text-[#2f6fed]">100 places — Lifetime bêta</p>
            <p className="mt-1 text-[13px] leading-relaxed text-[#64748b]">
              Accès Pro à vie pour 79 €. Idéal si AutoNet devient ton cockpit mensuel.
            </p>
          </div>
          <ButtonLink href="/register" variant="secondary" className="shrink-0">
            Réserver ma place
          </ButtonLink>
        </div>
        <p className="mt-5 text-[11px] leading-5 text-[#94a3b8]">{LEGAL_DISCLAIMER}</p>
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
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#0c8c5e]">{label}</p>
      <h2 className="mt-1 text-[16px] font-bold tracking-[-0.02em] text-[#0a0f1a]">{title}</h2>
    </div>
  );
}

function ResultLine({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 text-[13px]">
      <span className="text-[#64748b]">{label}</span>
      <span className={`tabular-nums ${strong ? "text-[15px] font-bold text-[#0c8c5e]" : "font-medium text-[#0a0f1a]"}`}>
        {value}
      </span>
    </div>
  );
}

function parseActivity(value: string | undefined): ActivityCategory {
  if (ACTIVITY_CATEGORIES.includes(value as ActivityCategory)) return value as ActivityCategory;
  return "SERVICE_BNC";
}
