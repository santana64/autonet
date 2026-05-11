import { requireUser } from "@/lib/auth";
import { enforceFeature } from "@/lib/plans";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireUser();
  await enforceFeature(user.id, "csvExport");
  const entries = await prisma.revenueEntry.findMany({
    where: { userId: user.id },
    orderBy: { collectionDate: "desc" },
  });
  const headers = [
    "date_encaissement",
    "client",
    "description",
    "categorie",
    "montant_euros",
    "reserve_estimee_euros",
    "disponible_estime_euros",
    "statut",
  ];
  const rows = entries.map((entry) => [
    entry.collectionDate.toISOString().slice(0, 10),
    entry.clientName ?? "",
    entry.description ?? "",
    entry.activityCategory,
    (entry.grossAmountCents / 100).toFixed(2),
    (entry.estimatedReserveCents / 100).toFixed(2),
    (entry.estimatedAvailableCents / 100).toFixed(2),
    entry.status,
  ]);
  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(";")).join("\n");

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="entrees-autonet.csv"`,
    },
  });
}

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}
