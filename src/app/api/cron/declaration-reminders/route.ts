import { addDays, endOfDay, startOfDay } from "date-fns";
import { formatMoney } from "@/domain/formatting/format";
import { reminderEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return Response.json({ error: "CRON_SECRET non configuré." }, { status: 503 });
  }

  const authorization = request.headers.get("authorization");
  if (authorization !== `Bearer ${secret}`) {
    return Response.json({ error: "Non autorisé." }, { status: 401 });
  }

  const targetDate = addDays(new Date(), 7);
  const targetStart = startOfDay(targetDate);
  const targetEnd = endOfDay(targetDate);

  const periods = await prisma.declarationPeriod.findMany({
    where: {
      dueDate: { gte: targetStart, lte: targetEnd },
      status: { not: "PAID" },
      user: {
        businessProfile: {
          is: { reminderEmailEnabled: true },
        },
      },
    },
    include: {
      reminders: {
        where: { type: "DECLARATION_DUE" },
        select: { id: true, title: true },
      },
      snapshots: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      user: {
        select: { email: true },
      },
    },
  });

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const period of periods) {
    const title = `Déclaration ${period.label} à préparer`;
    if (period.reminders.length > 0) {
      skipped += 1;
      continue;
    }

    const snapshot = period.snapshots[0];
    const description = [
      `Ta déclaration ${period.label} arrive dans 7 jours.`,
      snapshot ? `Montant estimé à réserver : ${formatMoney(snapshot.estimatedTotalDueCents)}.` : null,
      "Ouvre AutoNet pour vérifier ton disponible et préparer la déclaration.",
    ]
      .filter(Boolean)
      .join(" ");

    try {
      await reminderEmail({
        to: period.user.email,
        title,
        description,
        dueDate: period.dueDate ?? targetDate,
      });
      await prisma.reminder.create({
        data: {
          userId: period.userId,
          type: "DECLARATION_DUE",
          title,
          description,
          dueDate: period.dueDate ?? targetDate,
          status: "DONE",
          relatedDeclarationPeriodId: period.id,
        },
      });
      sent += 1;
    } catch {
      failed += 1;
    }
  }

  return Response.json(
    {
      scanned: periods.length,
      sent,
      skipped,
      failed,
    },
    { status: failed > 0 && sent === 0 && periods.length > 0 ? 500 : 200 }
  );
}
