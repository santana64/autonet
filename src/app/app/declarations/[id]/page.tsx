import { notFound } from "next/navigation";
import { addDeclarationNoteAction, refreshDeclarationSnapshotAction, updateDeclarationStatusAction } from "@/actions/declarations";
import { generateDocumentDirectAction } from "@/actions/documents";
import { ActionForm } from "@/components/forms/action-form";
import { TextArea } from "@/components/forms/fields";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, SectionHeader } from "@/components/ui/card";
import { activityLabels } from "@/domain/activity";
import { planAllows } from "@/domain/billing/plans";
import { calculateDeclarationSnapshot } from "@/domain/declarations/declarations";
import { formatMoney, formatShortDate } from "@/domain/formatting/format";
import { declarationActionLabels, declarationStatusLabels, labelFromMap, revenueStatusLabels } from "@/domain/labels";
import { getRulesForYear } from "@/domain/rules/default-rules";
import { requireUser } from "@/lib/auth";
import { getUserPlan } from "@/lib/plans";
import { prisma } from "@/lib/prisma";

export default async function DeclarationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const [period, profile, plan] = await Promise.all([
    prisma.declarationPeriod.findFirst({
      where: { id, userId: user.id },
      include: { snapshots: { orderBy: { createdAt: "desc" }, take: 1 } },
    }),
    prisma.businessProfile.findUnique({ where: { userId: user.id } }),
    getUserPlan(user.id),
  ]);
  if (!period || !profile) notFound();

  const entries = await prisma.revenueEntry.findMany({
    where: { userId: user.id, collectionDate: { gte: period.startDate, lte: period.endDate } },
    orderBy: { collectionDate: "asc" },
  });
  const liveSnapshot = calculateDeclarationSnapshot(
    period,
    entries.map((entry) => ({
      activityCategory: entry.activityCategory,
      collectionDate: entry.collectionDate,
      grossAmountCents: entry.grossAmountCents,
      status: entry.status,
    })),
    getRulesForYear(profile.contributionRulesYear),
    { taxWithholdingEnabled: profile.taxWithholdingEnabled }
  );
  const breakdown = liveSnapshot.breakdownJson.breakdown as Array<{
    activityCategory: keyof typeof activityLabels;
    revenueCents: number;
    socialCents: number;
    trainingCents: number;
    taxCents: number;
  }>;

  return (
    <>
      <SectionHeader
        action={<Badge tone={statusTone(period.status)}>{labelFromMap(declarationStatusLabels, period.status)}</Badge>}
        description={`${formatShortDate(period.startDate)} - ${formatShortDate(period.endDate)}. Échéance : ${formatShortDate(period.dueDate)}.`}
        title={period.label}
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        <Card>
          <h2 className="text-lg font-semibold">Synthèse estimative</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <Metric label="CA encaissé" value={formatMoney(liveSnapshot.totalRevenueCents)} />
            <Metric label="Cotisations" value={formatMoney(liveSnapshot.estimatedSocialContributionsCents)} />
            <Metric label="Versement fiscal" value={formatMoney(liveSnapshot.estimatedTaxWithholdingCents)} />
            <Metric label="À provisionner" value={formatMoney(liveSnapshot.estimatedTotalDueCents)} />
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-[#64748d]">
                <tr>
                  <th className="py-2">Activité</th>
                  <th>CA</th>
                  <th>Social</th>
                  <th>Formation</th>
                  <th>Fiscal</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.map((line) => (
                  <tr className="border-t border-[#eef4f8]" key={line.activityCategory}>
                    <td className="py-3">{activityLabels[line.activityCategory]}</td>
                    <td>{formatMoney(line.revenueCents)}</td>
                    <td>{formatMoney(line.socialCents)}</td>
                    <td>{formatMoney(line.trainingCents)}</td>
                    <td>{formatMoney(line.taxCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">Actions</h2>
          <div className="mt-4 grid gap-2">
            <form action={refreshDeclarationSnapshotAction}>
              <input name="id" type="hidden" value={period.id} />
              <Button type="submit" variant="secondary">Rafraîchir la synthèse</Button>
            </form>
            {(["READY", "DECLARED", "PAID"] as const).map((status) => (
              <form action={updateDeclarationStatusAction} key={status}>
                <input name="id" type="hidden" value={period.id} />
                <input name="status" type="hidden" value={status} />
                <Button type="submit" variant="secondary">
                  Marquer {declarationActionLabels[status]}
                </Button>
              </form>
            ))}
            {planAllows(plan, "documentExport") ? (
              <form action={generateDocumentDirectAction}>
                <input name="type" type="hidden" value="DECLARATION_SUMMARY" />
                <input name="declarationPeriodId" type="hidden" value={period.id} />
                <Button type="submit">Générer le résumé imprimable</Button>
              </form>
            ) : (
              <p className="rounded-[6px] bg-amber-50 p-3 text-sm text-amber-900">Résumé imprimable disponible en offre Solo.</p>
            )}
          </div>
          <div className="mt-5 rounded-[6px] bg-[#eef4f8] p-4 text-sm text-[#50617a]">
            <p className="font-semibold text-[#061b31]">Checklist avant déclaration</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Vérifier que seules les sommes encaissées sont incluses.</li>
              <li>Contrôler la ventilation par activité.</li>
              <li>Comparer avec l'espace officiel URSSAF.</li>
              <li>Conserver une provision bancaire dédiée.</li>
            </ul>
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="text-lg font-semibold">Lignes incluses</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-[#64748d]">
              <tr>
                <th className="py-2">Date</th>
                <th>Client</th>
                <th>Description</th>
                <th>Activité</th>
                <th>Montant</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr className="border-t border-[#eef4f8]" key={entry.id}>
                  <td className="py-3">{formatShortDate(entry.collectionDate)}</td>
                  <td>{entry.clientName ?? "Sans client"}</td>
                  <td>{entry.description}</td>
                  <td>{activityLabels[entry.activityCategory]}</td>
                  <td>{formatMoney(entry.grossAmountCents)}</td>
                  <td><Badge tone={statusTone(entry.status)}>{labelFromMap(revenueStatusLabels, entry.status)}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="mt-6">
        <h2 className="text-lg font-semibold">Note interne</h2>
        <ActionForm action={addDeclarationNoteAction} className="mt-4 space-y-4" submitLabel="Enregistrer la note">
          <input name="id" type="hidden" value={period.id} />
          <TextArea label="Note" name="notes" defaultValue={period.notes} />
        </ActionForm>
      </Card>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[6px] bg-[#eef4f8] p-3">
      <p className="text-xs text-[#64748d]">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
