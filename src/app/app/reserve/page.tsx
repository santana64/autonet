import { startOfMonth, endOfMonth } from "date-fns";
import { addReserveEventAction, saveReserveSnapshotAction } from "@/actions/reserve";
import { ActionForm } from "@/components/forms/action-form";
import { Field, Select, TextArea } from "@/components/forms/fields";
import { Card, SectionHeader } from "@/components/ui/card";
import { planAllows } from "@/domain/billing/plans";
import { calculatePeriodCashBreakdown } from "@/domain/cashflow/cashflow";
import { formatMoney, formatShortDate } from "@/domain/formatting/format";
import { labelFromMap, reserveEventTypeLabels } from "@/domain/labels";
import { getRulesForYear } from "@/domain/rules/default-rules";
import { requireUser } from "@/lib/auth";
import { getUserPlan } from "@/lib/plans";
import { prisma } from "@/lib/prisma";

export default async function ReservePage() {
  const user = await requireUser();
  const [profile, plan] = await Promise.all([
    prisma.businessProfile.findUniqueOrThrow({ where: { userId: user.id } }),
    getUserPlan(user.id),
  ]);
  const canTrack = planAllows(plan, "advancedReserveTracking");
  const now = new Date();
  const entries = await prisma.revenueEntry.findMany({
    where: { userId: user.id, collectionDate: { gte: startOfMonth(now), lte: endOfMonth(now) } },
  });
  const rules = getRulesForYear(profile.contributionRulesYear);
  const target = calculatePeriodCashBreakdown(
    entries.map((entry) => ({
      activityCategory: entry.activityCategory,
      collectionDate: entry.collectionDate,
      grossAmountCents: entry.grossAmountCents,
      status: entry.status,
    })),
    rules,
    {
      taxWithholdingEnabled: profile.taxWithholdingEnabled,
      conservativeReserveBufferRate: Number(profile.conservativeReserveBufferRate),
    }
  ).recommendedReserveCents;
  const [latest, events] = await Promise.all([
    prisma.cashReserveSnapshot.findFirst({ where: { userId: user.id }, orderBy: { snapshotDate: "desc" } }),
    prisma.reserveEvent.findMany({ where: { userId: user.id }, orderBy: { eventDate: "desc" }, take: 8 }),
  ]);
  const missing = Math.max(0, target - (latest?.manuallyReservedCents ?? 0));
  const prudent = Math.max(0, (latest?.bankBalanceCents ?? 0) - missing);

  return (
    <>
      <SectionHeader
        description="Sépare mentalement l'argent qui n'est pas vraiment à toi : URSSAF, impôt et marge de prudence."
        title="Réserve"
      />
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="À mettre de côté" value={formatMoney(target)} />
        <Metric label="Déjà mis de côté" value={formatMoney(latest?.manuallyReservedCents ?? 0)} />
        <Metric label="Manque à provisionner" value={formatMoney(missing)} />
        <Metric label="Disponible prudent" value={formatMoney(prudent)} accent />
      </div>

      {!canTrack ? (
        <Card className="mt-6 border-amber-200 bg-amber-50 text-amber-900">
          La gestion avancée de réserve est disponible en offre Pro. Les montants calculés restent visibles sur le dashboard.
        </Card>
      ) : (
        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <Card>
            <h2 className="text-lg font-semibold">Mettre à jour la réserve</h2>
            <ActionForm action={saveReserveSnapshotAction} className="mt-4 space-y-4" submitLabel="Enregistrer la réserve">
              <input name="targetReserveCents" type="hidden" value={target} />
              <Field label="Solde bancaire optionnel (€)" name="bankBalance" type="number" step="0.01" defaultValue={latest ? latest.bankBalanceCents ? latest.bankBalanceCents / 100 : "" : ""} />
              <Field label="Montant déjà réservé (€)" name="manuallyReserved" type="number" step="0.01" defaultValue={(latest?.manuallyReservedCents ?? 0) / 100} />
              <TextArea label="Note" name="notes" defaultValue={latest?.notes} />
            </ActionForm>
          </Card>
          <Card>
            <h2 className="text-lg font-semibold">Ajouter un mouvement</h2>
            <ActionForm action={addReserveEventAction} className="mt-4 space-y-4" submitLabel="Ajouter">
              <Select
                label="Type"
                name="type"
                options={[
                  { label: reserveEventTypeLabels.SET_ASIDE, value: "SET_ASIDE" },
                  { label: reserveEventTypeLabels.RELEASED, value: "RELEASED" },
                  { label: reserveEventTypeLabels.ADJUSTMENT, value: "ADJUSTMENT" },
                ]}
              />
              <Field label="Montant (€)" name="amount" required type="number" step="0.01" />
              <Field label="Date" name="eventDate" required type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
              <TextArea label="Note" name="note" />
            </ActionForm>
          </Card>
        </div>
      )}

      <Card className="mt-6">
        <h2 className="text-lg font-semibold">Historique</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-[#64748d]">
              <tr><th className="py-2">Date</th><th>Type</th><th>Montant</th><th>Note</th></tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr className="border-t border-[#eef4f8]" key={event.id}>
                  <td className="py-3">{formatShortDate(event.eventDate)}</td>
                  <td>{labelFromMap(reserveEventTypeLabels, event.type)}</td>
                  <td>{formatMoney(event.amountCents)}</td>
                  <td>{event.note ?? ""}</td>
                </tr>
              ))}
              {!events.length ? (
                <tr><td className="py-6 text-center text-[#64748d]" colSpan={4}>Aucun mouvement enregistré.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Card>
      <p className="text-xs font-medium uppercase tracking-[0.08em] text-[#64748d]">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${accent ? "text-[#0c8c5e]" : "text-[#061b31]"}`}>{value}</p>
    </Card>
  );
}
