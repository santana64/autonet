import { notFound } from "next/navigation";
import { updateRevenueAction } from "@/actions/revenues";
import { RevenueForm } from "@/components/app/revenue-form";
import { Card, SectionHeader } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function EditEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const [entry, clients] = await Promise.all([
    prisma.revenueEntry.findFirst({ where: { id, userId: user.id } }),
    prisma.client.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
  ]);
  if (!entry) notFound();
  return (
    <>
      <SectionHeader description="La modification recalcule la réserve et l'argent disponible estimé." title="Modifier l'entrée" />
      <Card>
        <RevenueForm action={updateRevenueAction} clients={clients} entry={entry} submitLabel="Recalculer et mettre à jour" />
      </Card>
    </>
  );
}
