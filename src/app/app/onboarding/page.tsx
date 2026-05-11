import Link from "next/link";
import {
  ArrowRight,
  BadgeEuro,
  CalendarClock,
  CircleAlert,
  CircleCheck,
  Gauge,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { completeOnboardingAction } from "@/actions/onboarding";
import { ActionForm } from "@/components/forms/action-form";
import { Field, Select } from "@/components/forms/fields";
import { ButtonLink } from "@/components/ui/button";
import { Card, SectionHeader } from "@/components/ui/card";
import { ACTIVITY_CATEGORIES, activityLabels } from "@/domain/activity";
import { calculateEntryCashBreakdown } from "@/domain/cashflow/cashflow";
import { formatMoney, formatShortDate } from "@/domain/formatting/format";
import { DecisionSignal } from "@/domain/simulator/simulator";
import { getRulesForYear } from "@/domain/rules/default-rules";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type SearchParams = {
  entry?: string;
  notice?: string;
};

export const metadata = {
  title: "Onboarding | AutoNet",
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const user = await requireUser();
  const params = (await searchParams) ?? {};
  const profile = await prisma.businessProfile.findUniqueOrThrow({ where: { userId: user.id } });
  const resultEntry = params.entry
    ? await prisma.revenueEntry.findFirst({
        where: { id: params.entry, userId: user.id },
      })
    : null;

  if (resultEntry) {
    const breakdown = calculateEntryCashBreakdown(
      {
        activityCategory: resultEntry.activityCategory,
        grossAmountCents: resultEntry.grossAmountCents,
        status: resultEntry.status,
      },
      getRulesForYear(profile.contributionRulesYear),
      {
        taxWithholdingEnabled: profile.taxWithholdingEnabled,
        conservativeReserveBufferRate: Number(profile.conservativeReserveBufferRate),
      }
    );
    const signal = getOnboardingSignal(breakdown.estimatedAvailableCents, breakdown.grossAmountCents);

    return (
      <>
        <SectionHeader
          action={
            <ButtonLink href="/app">
              Ouvrir mon dashboard
              <ArrowRight aria-hidden className="h-4 w-4" />
            </ButtonLink>
          }
          description="Premier encaissement enregistré. AutoNet a déjà séparé ce qui est à toi de ce qui doit rester en sécurité."
          title="Ton vrai disponible"
        />
        <StepRail currentStep={3} />
        <ResultPanel breakdown={breakdown} collectionDate={resultEntry.collectionDate} signal={signal} />
      </>
    );
  }

  return (
    <>
      <SectionHeader
        description="Trois étapes courtes pour transformer un premier encaissement en argent réellement utilisable."
        title="Démarrage guidé"
      />
      {params.notice ? (
        <p className="mb-5 rounded-[6px] border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {params.notice}
        </p>
      ) : null}
      <StepRail currentStep={1} />
      <div className="grid gap-6 xl:grid-cols-[1fr_0.72fr]">
        <Card>
          <ActionForm action={completeOnboardingAction} submitLabel="Voir mon vrai disponible">
            <div>
              <OnboardingBlock
                icon={Gauge}
                kicker="Étape 1"
                title="Ton activité"
                text="Ces deux réglages pilotent les taux et les échéances affichés ensuite."
              />
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Select
                  defaultValue={profile.mainActivityCategory}
                  label="Type d'activité"
                  name="activityCategory"
                  options={ACTIVITY_CATEGORIES.map((category) => ({
                    value: category,
                    label: activityLabels[category],
                  }))}
                />
                <Select
                  defaultValue={profile.declarationFrequency}
                  label="Fréquence de déclaration"
                  name="declarationFrequency"
                  options={[
                    { value: "MONTHLY", label: "Mensuelle" },
                    { value: "QUARTERLY", label: "Trimestrielle" },
                  ]}
                />
              </div>
              <label className="mt-4 flex items-start gap-3 rounded-[6px] border border-[#d8dfe8] bg-[#f8fafd] p-3 text-sm text-[#061b31]">
                <input
                  className="mt-0.5 h-4 w-4 accent-[#0c8c5e]"
                  defaultChecked={profile.taxWithholdingEnabled}
                  name="taxWithholdingEnabled"
                  type="checkbox"
                />
                <span>
                  <span className="block font-semibold">J'ai opté pour le versement libératoire</span>
                  <span className="mt-1 block text-[#50617a]">
                    AutoNet intégrera aussi l'impôt dans la réserve prudente.
                  </span>
                </span>
              </label>
            </div>

            <div className="border-t border-[#d8dfe8] pt-5">
              <OnboardingBlock
                icon={WalletCards}
                kicker="Étape 2"
                title="Ton premier encaissement"
                text="Un montant encaissé suffit pour calculer immédiatement le disponible prudent."
              />
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field
                  inputMode="decimal"
                  label="Montant encaissé"
                  min="1"
                  name="grossAmount"
                  required
                  step="0.01"
                  type="number"
                />
                <Field
                  defaultValue={inputDateValue(new Date())}
                  label="Date d'encaissement"
                  name="collectionDate"
                  required
                  type="date"
                />
              </div>
            </div>
          </ActionForm>
        </Card>

        <div className="space-y-6">
          <Card>
            <OnboardingBlock
              icon={ShieldCheck}
              kicker="Étape 3"
              title="Ton vrai disponible"
              text="Après validation, tu obtiens le feu financier et la ventilation exacte de ton encaissement."
            />
            <div className="mt-5 divide-y divide-[#d8dfe8]">
              <MoneyRow label="CA encaissé" value="-" />
              <MoneyRow label="À réserver" value="-" />
              <MoneyRow label="Disponible prudent" value="-" strong />
            </div>
          </Card>

          <Card className="border-[#0c8c5e]/35 bg-[#f6fbf8]">
            <div className="flex items-start gap-3">
              <BadgeEuro aria-hidden className="mt-0.5 h-5 w-5 text-[#0c8c5e]" />
              <div>
                <p className="text-sm font-semibold text-[#061b31]">Activation immédiate</p>
                <p className="mt-1 text-sm leading-6 text-[#50617a]">
                  À la fin, ton dashboard contient déjà un encaissement, une déclaration à venir et une réserve de sécurité.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

function StepRail({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  const steps = [
    { step: 1, label: "Ton activité" },
    { step: 2, label: "Premier encaissement" },
    { step: 3, label: "Vrai disponible" },
  ] as const;

  return (
    <div className="mb-5 grid gap-2 md:grid-cols-3">
      {steps.map((item) => {
        const isDone = item.step < currentStep;
        const isCurrent = item.step === currentStep;
        return (
          <div
            className={`flex min-h-14 items-center gap-3 rounded-[6px] border px-3 py-2 ${
              isDone || isCurrent
                ? "border-[#0c8c5e]/30 bg-[#f6fbf8] text-[#061b31]"
                : "border-[#d8dfe8] bg-white text-[#50617a]"
            }`}
            key={item.step}
          >
            <span
              className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                isDone || isCurrent ? "bg-[#0c8c5e] text-white" : "bg-[#eef4f8] text-[#50617a]"
              }`}
            >
              {isDone ? <CircleCheck aria-hidden className="h-4 w-4" /> : item.step}
            </span>
            <span className="text-sm font-semibold">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function ResultPanel({
  breakdown,
  collectionDate,
  signal,
}: {
  breakdown: ReturnType<typeof calculateEntryCashBreakdown>;
  collectionDate: Date;
  signal: DecisionSignal;
}) {
  const config = signalConfig[signal];
  const reserveCents = breakdown.recommendedReserveCents;

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.72fr]">
      <Card className={`border-l-4 ${config.border}`}>
        <div className={`inline-flex items-center gap-2 rounded-[6px] px-3 py-1 text-sm font-semibold ${config.badge}`}>
          <config.icon aria-hidden className="h-4 w-4" />
          {config.label}
        </div>
        <p className="mt-5 text-sm font-medium text-[#50617a]">Argent vraiment utilisable</p>
        <h2 className="mt-2 text-4xl font-semibold text-[#061b31] sm:text-5xl">
          {formatMoney(breakdown.estimatedAvailableCents)}
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[#50617a]">
          Tu peux utiliser {formatMoney(breakdown.estimatedAvailableCents)} sans fragiliser ta prochaine déclaration.
          Garde {formatMoney(reserveCents)} de côté pour l'URSSAF, l'impôt éventuel et la marge prudente.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <ButtonLink href="/app">
            Voir le cockpit
            <ArrowRight aria-hidden className="h-4 w-4" />
          </ButtonLink>
          <ButtonLink href="/app/entries/new" variant="secondary">
            Ajouter un autre encaissement
          </ButtonLink>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2 text-sm font-semibold text-[#0c8c5e]">
          <CalendarClock aria-hidden className="h-4 w-4" />
          Encaissement du {formatShortDate(collectionDate)}
        </div>
        <div className="mt-4 divide-y divide-[#d8dfe8]">
          <MoneyRow label="Tu as encaissé" value={formatMoney(breakdown.grossAmountCents)} />
          <MoneyRow
            label="À réserver URSSAF"
            value={formatMoney(
              breakdown.socialContributionEstimateCents + breakdown.trainingContributionEstimateCents
            )}
          />
          <MoneyRow label="À réserver impôt" value={formatMoney(breakdown.taxWithholdingEstimateCents)} />
          <MoneyRow label="Marge prudente" value={formatMoney(breakdown.conservativeBufferCents)} />
          <MoneyRow label="Argent à toi" value={formatMoney(breakdown.estimatedAvailableCents)} strong />
        </div>
        <Link className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#0c8c5e]" href="/app/declarations">
          Voir la déclaration créée
          <ArrowRight aria-hidden className="h-4 w-4" />
        </Link>
      </Card>
    </div>
  );
}

function OnboardingBlock({
  icon: Icon,
  kicker,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  kicker: string;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px] bg-[#eef4f8] text-[#0c8c5e]">
        <Icon aria-hidden className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#0c8c5e]">{kicker}</p>
        <h2 className="mt-1 text-lg font-semibold text-[#061b31]">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-[#50617a]">{text}</p>
      </div>
    </div>
  );
}

function MoneyRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 text-sm">
      <span className="text-[#50617a]">{label}</span>
      <span className={`text-right tabular-nums ${strong ? "text-base font-semibold text-[#061b31]" : "font-medium text-[#061b31]"}`}>
        {value}
      </span>
    </div>
  );
}

function getOnboardingSignal(availableCents: number, grossCents: number): DecisionSignal {
  if (availableCents <= 0) return "RED";
  if (grossCents > 0 && availableCents / grossCents < 0.55) return "ORANGE";
  return "GREEN";
}

function inputDateValue(date: Date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

const signalConfig = {
  GREEN: {
    label: "Feu vert financier",
    border: "border-l-[#0c8c5e]",
    badge: "bg-emerald-50 text-emerald-800",
    icon: CircleCheck,
  },
  ORANGE: {
    label: "Zone orange",
    border: "border-l-[#b76e00]",
    badge: "bg-amber-50 text-amber-900",
    icon: CircleAlert,
  },
  RED: {
    label: "À sécuriser",
    border: "border-l-red-700",
    badge: "bg-red-50 text-red-800",
    icon: CircleAlert,
  },
} satisfies Record<
  DecisionSignal,
  {
    label: string;
    border: string;
    badge: string;
    icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  }
>;
