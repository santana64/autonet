import { prisma } from "@/lib/prisma";
import { ProspectingClient } from "./client";

export const dynamic = "force-dynamic";

export default async function ProspectingPage() {
  const [prospects, stats] = await Promise.all([
    prisma.prospect.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.prospect.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
  ]);

  const statMap = Object.fromEntries(stats.map((s) => [s.status, s._count.id]));

  return (
    <ProspectingClient
      prospects={prospects}
      stats={{
        total: prospects.length,
        new: statMap["new"] ?? 0,
        contacted: statMap["contacted"] ?? 0,
        replied: statMap["replied"] ?? 0,
        converted: statMap["converted"] ?? 0,
        unsubscribed: statMap["unsubscribed"] ?? 0,
      }}
    />
  );
}
