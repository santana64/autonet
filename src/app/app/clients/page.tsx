import { createClientAction, deleteClientAction, updateClientDirectAction } from "@/actions/clients";
import { ActionForm } from "@/components/forms/action-form";
import { Field, TextArea } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { Card, SectionHeader } from "@/components/ui/card";
import { formatMoney, formatShortDate } from "@/domain/formatting/format";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ClientsPage() {
  const user = await requireUser();
  const clients = await prisma.client.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
    include: { revenueEntries: { where: { status: "COLLECTED" }, orderBy: { collectionDate: "desc" } } },
  });

  return (
    <>
      <SectionHeader description="Un carnet simple, centré sur les encaissements par client." title="Clients" />
      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <h2 className="text-lg font-semibold">Nouveau client</h2>
          <ActionForm action={createClientAction} className="mt-4 space-y-4" submitLabel="Créer le client">
            <Field label="Nom" name="name" required />
            <Field label="Société" name="companyName" />
            <Field label="Email" name="email" type="email" />
            <TextArea label="Notes" name="notes" />
          </ActionForm>
        </Card>
        <div className="space-y-4">
          {clients.map((client) => {
            const total = client.revenueEntries.reduce((sum, entry) => sum + entry.grossAmountCents, 0);
            const lastPayment = client.revenueEntries[0]?.collectionDate;
            return (
              <Card key={client.id}>
                <form action={updateClientDirectAction} className="grid gap-3 md:grid-cols-2">
                  <input name="id" type="hidden" value={client.id} />
                  <Field label="Nom" name="name" defaultValue={client.name} required />
                  <Field label="Société" name="companyName" defaultValue={client.companyName} />
                  <Field label="Email" name="email" defaultValue={client.email} type="email" />
                  <div className="rounded-md bg-slate-50 p-3 text-sm">
                    <p>Total encaissé : <strong>{formatMoney(total)}</strong></p>
                    <p>Dernier paiement : {lastPayment ? formatShortDate(lastPayment) : "Aucun"}</p>
                  </div>
                  <div className="md:col-span-2">
                    <TextArea label="Notes" name="notes" defaultValue={client.notes} />
                  </div>
                  <div className="flex gap-2 md:col-span-2">
                    <Button type="submit" variant="secondary">
                      Mettre à jour
                    </Button>
                  </div>
                </form>
                <form action={deleteClientAction} className="mt-3">
                  <input name="id" type="hidden" value={client.id} />
                  <Button type="submit" variant="ghost">
                    Supprimer
                  </Button>
                </form>
              </Card>
            );
          })}
          {!clients.length ? <Card className="text-sm text-slate-600">Aucun client pour le moment.</Card> : null}
        </div>
      </div>
    </>
  );
}
