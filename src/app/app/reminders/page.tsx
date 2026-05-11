import Link from "next/link";
import { CalendarClock, CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { createReminderAction, updateReminderStatusAction } from "@/actions/reminders";
import { ActionForm } from "@/components/forms/action-form";
import { Field, Select, TextArea } from "@/components/forms/fields";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, SectionHeader } from "@/components/ui/card";
import { formatShortDate } from "@/domain/formatting/format";
import { labelFromMap, reminderStatusLabels, reminderTypeLabels } from "@/domain/labels";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function RemindersPage() {
  const user = await requireUser();
  const reminders = await prisma.reminder.findMany({
    where: { userId: user.id },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    include: { relatedDeclarationPeriod: true },
  });
  const pendingCount = reminders.filter((reminder) => reminder.status === "PENDING").length;

  return (
    <>
      <SectionHeader
        description="Rappels automatiques et manuels pour revenir au bon moment : déclaration, réserve, seuils, TVA ou action libre."
        title="Rappels"
      />

      <div className="grid gap-6 xl:grid-cols-[0.72fr_1fr]">
        <Card>
          <div className="flex items-start gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-[6px] bg-[#eef4f8] text-[#0c8c5e]">
              <CalendarClock aria-hidden className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#061b31]">Créer un rappel</h2>
              <p className="mt-1 text-sm leading-6 text-[#50617a]">
                Un rappel simple suffit pour garder les échéances visibles dans le cockpit.
              </p>
            </div>
          </div>

          <ActionForm action={createReminderAction} className="mt-5 space-y-4" submitLabel="Créer le rappel">
            <Field label="Titre" name="title" required />
            <div className="grid gap-4 md:grid-cols-2">
              <Select
                label="Type"
                name="type"
                options={Object.entries(reminderTypeLabels).map(([value, label]) => ({ value, label }))}
              />
              <Field
                defaultValue={inputDateValue(new Date())}
                label="Date d'échéance"
                name="dueDate"
                required
                type="date"
              />
            </div>
            <TextArea label="Description" name="description" />
          </ActionForm>
        </Card>

        <Card>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#061b31]">File de rappels</h2>
              <p className="mt-1 text-sm text-[#50617a]">{pendingCount} rappel{pendingCount > 1 ? "s" : ""} à traiter.</p>
            </div>
            <Badge tone={pendingCount > 0 ? "warning" : "success"}>
              {pendingCount > 0 ? "Action requise" : "À jour"}
            </Badge>
          </div>

          <div className="mt-5 divide-y divide-[#d8dfe8]">
            {reminders.map((reminder) => (
              <div className="flex flex-col gap-4 py-4 lg:flex-row lg:items-start lg:justify-between" key={reminder.id}>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={statusTone(reminder.status)}>
                      {labelFromMap(reminderStatusLabels, reminder.status)}
                    </Badge>
                    <Badge>{labelFromMap(reminderTypeLabels, reminder.type)}</Badge>
                    <span className="text-xs font-semibold text-[#64748d]">{formatShortDate(reminder.dueDate)}</span>
                  </div>
                  <p className="mt-2 font-semibold text-[#061b31]">{reminder.title}</p>
                  {reminder.description ? (
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-[#50617a]">{reminder.description}</p>
                  ) : null}
                  {reminder.relatedDeclarationPeriod ? (
                    <Link
                      className="mt-2 inline-flex text-sm font-semibold text-[#0c8c5e] hover:text-[#08764f]"
                      href={`/app/declarations/${reminder.relatedDeclarationPeriod.id}`}
                    >
                      Ouvrir {reminder.relatedDeclarationPeriod.label}
                    </Link>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {reminder.status !== "DONE" ? (
                    <StatusButton id={reminder.id} icon={CheckCircle2} label="Terminé" status="DONE" />
                  ) : null}
                  {reminder.status !== "PENDING" ? (
                    <StatusButton id={reminder.id} icon={RotateCcw} label="Réouvrir" status="PENDING" />
                  ) : null}
                  {reminder.status !== "CANCELLED" ? (
                    <StatusButton id={reminder.id} icon={XCircle} label="Annuler" status="CANCELLED" />
                  ) : null}
                </div>
              </div>
            ))}
            {!reminders.length ? (
              <p className="py-8 text-center text-sm text-[#64748d]">
                Aucun rappel pour l'instant. Les rappels de déclaration automatiques apparaîtront ici après envoi.
              </p>
            ) : null}
          </div>
        </Card>
      </div>
    </>
  );
}

function StatusButton({
  id,
  icon: Icon,
  label,
  status,
}: {
  id: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  status: "DONE" | "PENDING" | "CANCELLED";
}) {
  return (
    <form action={updateReminderStatusAction}>
      <input name="id" type="hidden" value={id} />
      <input name="status" type="hidden" value={status} />
      <Button type="submit" variant="secondary">
        <Icon aria-hidden className="h-4 w-4" />
        {label}
      </Button>
    </form>
  );
}

function inputDateValue(date: Date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}
