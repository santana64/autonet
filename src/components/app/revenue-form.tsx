import type { ActionState } from "@/actions/auth";
import { ActionForm } from "@/components/forms/action-form";
import { Field, Select, TextArea, activityOptions } from "@/components/forms/fields";
import { centsToInput } from "@/domain/formatting/format";

type RevenueFormEntry = {
  id?: string;
  clientId?: string | null;
  clientName?: string | null;
  description?: string | null;
  activityCategory?: string | null;
  invoiceDate?: Date | null;
  collectionDate?: Date | null;
  grossAmountCents?: number | null;
  paymentMethod?: string | null;
  status?: string | null;
  notes?: string | null;
};

export function RevenueForm({
  action,
  clients,
  entry,
  submitLabel,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  clients: Array<{ id: string; name: string }>;
  entry?: RevenueFormEntry;
  submitLabel: string;
}) {
  return (
    <ActionForm action={action} submitLabel={submitLabel}>
      {entry?.id ? <input name="id" type="hidden" value={entry.id} /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <Select
          defaultValue={entry?.clientId ?? ""}
          label="Client existant"
          name="clientId"
          options={[{ label: "Aucun / saisir un nom", value: "" }, ...clients.map((client) => ({ label: client.name, value: client.id }))]}
        />
        <Field label="Nom client libre" name="clientName" defaultValue={entry?.clientName} />
      </div>
      <Field label="Description" name="description" defaultValue={entry?.description} />
      <div className="grid gap-4 md:grid-cols-2">
        <Select
          defaultValue={entry?.activityCategory ?? "SERVICE_BNC"}
          label="Type d'activité"
          name="activityCategory"
          options={activityOptions}
        />
        <Select
          defaultValue={entry?.status ?? "COLLECTED"}
          label="Statut"
          name="status"
          options={[
            { label: "Encaissé à déclarer", value: "COLLECTED" },
            { label: "Facture en attente", value: "PENDING_INVOICE" },
            { label: "Exclu / non déclaré", value: "EXCLUDED" },
          ]}
          help="La déclaration se base sur l'encaissement brut, pas sur la facture émise."
        />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Date de facture" name="invoiceDate" type="date" defaultValue={dateInput(entry?.invoiceDate)} />
        <Field
          label="Date d'encaissement"
          name="collectionDate"
          required
          type="date"
          defaultValue={dateInput(entry?.collectionDate ?? new Date())}
          help="Cette date rattache automatiquement l'entrée à une période de déclaration."
        />
        <Field
          defaultValue={centsToInput(entry?.grossAmountCents)}
          label="Montant brut encaissé (€)"
          min="0"
          name="grossAmount"
          required
          step="0.01"
          type="number"
        />
      </div>
      <Field label="Méthode de paiement" name="paymentMethod" defaultValue={entry?.paymentMethod} />
      <TextArea label="Notes" name="notes" defaultValue={entry?.notes} />
    </ActionForm>
  );
}

function dateInput(date: Date | null | undefined) {
  return date ? new Date(date).toISOString().slice(0, 10) : "";
}
