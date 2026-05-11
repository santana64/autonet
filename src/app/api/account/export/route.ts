import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireUser();
  const [
    businessProfile,
    clients,
    revenueEntries,
    declarationPeriods,
    reminders,
    generatedDocuments,
    subscription,
  ] = await Promise.all([
    prisma.businessProfile.findUnique({ where: { userId: user.id } }),
    prisma.client.findMany({ where: { userId: user.id } }),
    prisma.revenueEntry.findMany({ where: { userId: user.id } }),
    prisma.declarationPeriod.findMany({
      where: { userId: user.id },
      include: { snapshots: true },
    }),
    prisma.reminder.findMany({ where: { userId: user.id } }),
    prisma.generatedDocument.findMany({ where: { userId: user.id } }),
    prisma.subscription.findUnique({ where: { userId: user.id } }),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    account: {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerifiedAt: user.emailVerifiedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    businessProfile,
    clients,
    revenueEntries,
    declarationPeriods,
    reminders,
    generatedDocuments,
    subscription,
  };

  return Response.json(payload, {
    headers: {
      "content-disposition": `attachment; filename="donnees-autonet.json"`,
    },
  });
}
