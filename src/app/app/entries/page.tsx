import Link from "next/link";
import { deleteRevenueAction } from "@/actions/revenues";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, SectionHeader } from "@/components/ui/card";
import { ACTIVITY_CATEGORIES, activityLabels } from "@/domain/activity";
import { planAllows } from "@/domain/billing/plans";
import { formatMoney, formatShortDate } from "@/domain/formatting/format";
import { labelFromMap, revenueStatusLabels } from "@/domain/labels";
import { requireUser } from "@/lib/auth";
import { getUserPlan } from "@/lib/plans";
import { prisma } from "@/lib/prisma";

export default async function EntriesPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; activity?: string; status?: string }>;
}) {
  const user = await requireUser();
  const params = (await searchParams) ?? {};
  const plan = await getUserPlan(user.id);
  const entries = await prisma.revenueEntry.findMany({
    where: {
      userId: user.id,
      activityCategory: ACTIVITY_CATEGORIES.includes(params.activity as never) ? (params.activity as never) : undefined,
      status: ["COLLECTED", "PENDING_INVOICE", "EXCLUDED"].includes(params.status ?? "") ? (params.status as never) : undefined,
      OR: params.q
        ? [
            { clientName: { contains: params.q, mode: "insensitive" } },
            { description: { contains: params.q, mode: "insensitive" } },
            { notes: { contains: params.q, mode: "insensitive" } },
          ]
        : undefined,
    },
    orderBy: { collectionDate: "desc" },
  });

  return (
    <>
      <SectionHeader
        action={<ButtonLink href="/app/entries/new">Encaisser vite</ButtonLink>}
        description="Chaque ligne montre le brut encaissé, la réserve estimée et l'argent disponible estimé."
        title="Entrées encaissées"
      />

      <Card>
        <form className="grid gap-3 md:grid-cols-4">
          <input className="rounded-[6px] border border-[#d8dfe8] px-3 py-2 text-sm" defaultValue={params.q ?? ""} name="q" placeholder="Client ou description" />
          <select className="rounded-[6px] border border-[#d8dfe8] px-3 py-2 text-sm" defaultValue={params.activity ?? ""} name="activity">
            <option value="">Toutes activités</option>
            {ACTIVITY_CATEGORIES.map((category) => (
              <option key={category} value={category}>{activityLabels[category]}</option>
            ))}
          </select>
          <select className="rounded-[6px] border border-[#d8dfe8] px-3 py-2 text-sm" defaultValue={params.status ?? ""} name="status">
            <option value="">Tous statuts</option>
            <option value="COLLECTED">Encaissé</option>
            <option value="PENDING_INVOICE">Facture en attente</option>
            <option value="EXCLUDED">Exclu</option>
          </select>
          <Button type="submit" variant="secondary">Filtrer</Button>
        </form>
        <div className="mt-4 flex justify-end">
          {planAllows(plan, "csvExport") ? (
            <ButtonLink href="/api/entries/export" variant="secondary">Export CSV</ButtonLink>
          ) : (
            <p className="text-sm text-[#64748d]">Export CSV disponible en offre Pro.</p>
          )}
        </div>
      </Card>

      <Card className="mt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-[#64748d]">
              <tr>
                <th className="py-2">Date</th>
                <th>Client</th>
                <th>Description</th>
                <th>Brut encaissé</th>
                <th>À réserver</th>
                <th>Disponible</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr className="border-t border-[#eef4f8]" key={entry.id}>
                  <td className="py-3">{formatShortDate(entry.collectionDate)}</td>
                  <td>{entry.clientName ?? "Sans client"}</td>
                  <td>{entry.description ?? activityLabels[entry.activityCategory]}</td>
                  <td className="font-medium">{formatMoney(entry.grossAmountCents)}</td>
                  <td>{formatMoney(entry.estimatedReserveCents)}</td>
                  <td className="font-semibold text-[#0c8c5e]">{formatMoney(entry.estimatedAvailableCents)}</td>
                  <td><Badge tone={statusTone(entry.status)}>{labelFromMap(revenueStatusLabels, entry.status)}</Badge></td>
                  <td className="flex justify-end gap-2 py-2">
                    <Link className="rounded-[6px] px-3 py-2 text-sm underline" href={`/app/entries/${entry.id}/edit`}>
                      Modifier
                    </Link>
                    <form action={deleteRevenueAction}>
                      <input name="id" type="hidden" value={entry.id} />
                      <Button type="submit" variant="ghost">Supprimer</Button>
                    </form>
                  </td>
                </tr>
              ))}
              {!entries.length ? (
                <tr>
                  <td className="py-8 text-center text-[#64748d]" colSpan={8}>
                    Aucune entrée. Ajoutez un encaissement pour voir le vrai disponible.
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
