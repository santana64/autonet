import { endOfYear, startOfYear } from "date-fns";
import { generateDocumentDirectAction } from "@/actions/documents";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, SectionHeader } from "@/components/ui/card";
import { planAllows } from "@/domain/billing/plans";
import { activityLabels } from "@/domain/activity";
import { formatMoney, formatPercent } from "@/domain/formatting/format";
import { groupRevenueByActivity } from "@/domain/revenue/revenue";
import { getRulesForYear } from "@/domain/rules/default-rules";
import { evaluateMicroThresholdUsage, evaluateVatWarning, projectAnnualRevenue, ThresholdRiskLevel } from "@/domain/thresholds/thresholds";
import { requireUser } from "@/lib/auth";
import { getUserPlan } from "@/lib/plans";
import { prisma } from "@/lib/prisma";

export default async function ThresholdsPage() {
  const user = await requireUser();
  const [profile, plan] = await Promise.all([
    prisma.businessProfile.findUniqueOrThrow({ where: { userId: user.id } }),
    getUserPlan(user.id),
  ]);
  const now = new Date();
  const entries = await prisma.revenueEntry.findMany({
    where: { userId: user.id, collectionDate: { gte: startOfYear(now), lte: endOfYear(now) } },
  });
  const revenueLike = entries.map((entry) => ({
    activityCategory: entry.activityCategory,
    collectionDate: entry.collectionDate,
    grossAmountCents: entry.grossAmountCents,
    status: entry.status,
  }));
  const byActivity = groupRevenueByActivity(revenueLike);
  const rules = getRulesForYear(profile.contributionRulesYear);
  const micro = evaluateMicroThresholdUsage(byActivity, profile, rules);
  const vat = evaluateVatWarning(byActivity, profile, rules);
  const projected = projectAnnualRevenue(revenueLike, now);
  const scenarios = [
    ["Rythme actuel", projected.projectedAnnualRevenueCents],
    ["Conservateur", Math.round(projected.projectedAnnualRevenueCents * 0.85)],
    ["Optimiste", Math.round(projected.projectedAnnualRevenueCents * 1.18)],
  ];

  return (
    <>
      <SectionHeader
        action={
          planAllows(plan, "documentExport") ? (
            <form action={generateDocumentDirectAction}>
              <input name="type" type="hidden" value="THRESHOLD_RADAR_REPORT" />
              <Button type="submit">Générer un rapport</Button>
            </form>
          ) : undefined
        }
        description="Surveillance prudente des seuils micro et TVA. Les résultats restent à vérifier selon votre situation."
        title="Radar de seuils"
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Seuil micro-entreprise</h2>
              <p className="mt-1 text-sm text-[#50617a]">{micro.notes}</p>
            </div>
            <Badge tone={micro.riskLevel === "OK" ? "success" : micro.riskLevel === "WATCH" ? "warning" : "danger"}>
              {riskLabel(micro.riskLevel)}
            </Badge>
          </div>
          <div className="mt-5">
            <div className="flex justify-between text-sm">
              <span>{formatMoney(micro.totalRevenueCents)} encaissés</span>
              <span>{formatMoney(micro.thresholdCents)}</span>
            </div>
            <Progress value={micro.usagePercent} level={micro.riskLevel} />
            <p className="mt-2 text-sm font-medium">{formatPercent(micro.usagePercent)} du seuil global</p>
            {micro.servicePartThresholdCents ? (
              <p className="mt-2 text-sm text-[#50617a]">
                Part services : {formatMoney(micro.serviceRevenueCents)} / {formatMoney(micro.servicePartThresholdCents)} (
                {formatPercent(micro.serviceUsagePercent ?? 0)})
              </p>
            ) : null}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">TVA / franchise en base</h2>
          <p className="mt-3 rounded-[6px] bg-amber-50 p-3 text-sm text-amber-900">{vat.message}</p>
          <div className="mt-4 text-sm text-[#50617a]">
            <p>Seuil de base surveillé : {formatMoney(vat.vatBaseThresholdCents)}</p>
            <p>Limite majorée surveillée : {formatMoney(vat.vatIncreasedThresholdCents)}</p>
            <p>Usage base : {formatPercent(vat.usagePercent)}</p>
          </div>
          <Progress value={vat.usagePercent} level={vat.riskLevel} />
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="text-lg font-semibold">Ventilation annuelle</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Object.entries(byActivity).map(([category, cents]) => (
            <div className="rounded-[6px] bg-[#eef4f8] p-3" key={category}>
              <p className="text-sm text-[#64748d]">{activityLabels[category as keyof typeof activityLabels]}</p>
              <p className="text-lg font-semibold">{formatMoney(cents)}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-6">
        <h2 className="text-lg font-semibold">Projection annuelle</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {scenarios.map(([label, value]) => (
            <div className="rounded-[6px] border border-[#d8dfe8] p-4" key={label}>
              <p className="text-sm text-[#64748d]">{label}</p>
              <p className="mt-1 text-xl font-bold">{formatMoney(Number(value))}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-[#50617a]">
          Si votre rythme continue, vous pourriez atteindre environ {formatMoney(projected.projectedAnnualRevenueCents)} cette année.
          Projection basée sur le rythme d'encaissement depuis le début de l'année, à vérifier selon votre saisonnalité.
        </p>
      </Card>
    </>
  );
}

function Progress({ value, level }: { value: number; level: ThresholdRiskLevel }) {
  return (
    <div className="mt-2 h-4 rounded-[6px] bg-[#eef4f8]">
      <div
        className={`h-4 rounded-[6px] ${progressColor(level)}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

function progressColor(level: ThresholdRiskLevel) {
  if (level === "OK") return "bg-[#0c8c5e]";
  if (level === "WATCH") return "bg-[#b76e00]";
  if (level === "WARNING") return "bg-amber-600";
  return "bg-red-700";
}

function riskLabel(level: string) {
  if (level === "OK") return "Tranquille";
  if (level === "WATCH") return "À surveiller";
  if (level === "WARNING") return "Proche du seuil";
  return "Critique";
}
