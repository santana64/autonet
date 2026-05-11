import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { userNudgeEmail, userUpgradeEmail, APP_URL } from "@/actions/lead";

export async function GET(request: Request) {
  if (request.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return Response.json({ skipped: "no resend key" });

  const resend = new Resend(apiKey);
  const from = process.env.EMAIL_FROM ?? "AutoNet <onboarding@resend.dev>";
  const now = new Date();
  const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);

  let nudgeSent = 0;
  let upgradeSent = 0;

  // ── Onboarding nudge (Day 3): users with no revenue entries ──────────────
  const inactiveUsers = await prisma.user.findMany({
    where: {
      createdAt: { gte: daysAgo(4), lte: daysAgo(3) },
      revenueEntries: { none: {} },
    },
    select: { email: true },
    take: 100,
  });

  for (const user of inactiveUsers) {
    try {
      await resend.emails.send({
        from,
        to: user.email,
        subject: "Ton cockpit AutoNet t'attend",
        html: userNudgeEmail(user.email),
        text: `Saisis ton premier encaissement : ${APP_URL}/app/entries/new`,
      });
      nudgeSent++;
    } catch {
      // continue
    }
  }

  // ── Upgrade prompt (Day 7): active free users with entries ───────────────
  const freeActiveUsers = await prisma.user.findMany({
    where: {
      createdAt: { gte: daysAgo(8), lte: daysAgo(7) },
      subscription: { plan: "FREE" },
      revenueEntries: { some: {} },
    },
    select: { email: true },
    take: 100,
  });

  for (const user of freeActiveUsers) {
    try {
      await resend.emails.send({
        from,
        to: user.email,
        subject: "Tu utilises AutoNet — voilà ce que tu rates encore",
        html: userUpgradeEmail(user.email),
        text: `Passer à Solo — 9 €/mois : ${APP_URL}/app/billing`,
      });
      upgradeSent++;
    } catch {
      // continue
    }
  }

  return Response.json({ nudgeSent, upgradeSent });
}
