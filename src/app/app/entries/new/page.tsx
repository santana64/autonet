import { createRevenueAction } from "@/actions/revenues";
import { QuickCashEstimate } from "@/components/app/quick-cash-estimate";
import { RevenueForm } from "@/components/app/revenue-form";
import { Card, SectionHeader } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function NewEntryPage() {
  const user = await requireUser();
  const [clients, profile] = await Promise.all([
    prisma.client.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
    prisma.businessProfile.findUniqueOrThrow({ where: { userId: user.id } }),
  ]);
  return (
    <>
      <SectionHeader
        description="Le montant encaissé est le point de départ. AutoNet estime immédiatement la réserve et le disponible."
        title="Nouvelle entrée"
      />
      <Card>
        <QuickCashEstimate
          bufferRate={Number(profile.conservativeReserveBufferRate)}
          defaultCategory={profile.mainActivityCategory}
          taxWithholdingEnabled={profile.taxWithholdingEnabled}
        />
        <div className="my-5 border-t border-[#d8dfe8]" />
        <RevenueForm action={createRevenueAction} clients={clients} submitLabel="Calculer et enregistrer" />
      </Card>
    </>
  );
}
