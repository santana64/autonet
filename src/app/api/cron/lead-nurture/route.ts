import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { nurtureEmail2, nurtureEmail3, nurtureEmail4, FOUNDER_EMAIL, APP_URL } from "@/actions/lead";

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

  // Find leads ready for each step (step N, created >= N days ago)
  const [step1Leads, step2Leads, step3Leads] = await Promise.all([
    prisma.lead.findMany({ where: { step: 1, createdAt: { lte: daysAgo(2) } }, take: 50 }),
    prisma.lead.findMany({ where: { step: 2, createdAt: { lte: daysAgo(5) } }, take: 50 }),
    prisma.lead.findMany({ where: { step: 3, createdAt: { lte: daysAgo(10) } }, take: 50 }),
  ]);

  // Skip leads who have since registered
  const allEmails = [...step1Leads, ...step2Leads, ...step3Leads].map((l) => l.email);
  const registeredEmails = new Set(
    (await prisma.user.findMany({ where: { email: { in: allEmails } }, select: { email: true } })).map((u) => u.email)
  );

  let sent = 0;

  const sendAndAdvance = async (
    leads: typeof step1Leads,
    nextStep: number,
    subject: string,
    htmlFn: (email: string) => string
  ) => {
    for (const lead of leads) {
      if (registeredEmails.has(lead.email)) {
        await prisma.lead.update({ where: { id: lead.id }, data: { step: 99 } });
        continue;
      }
      try {
        await resend.emails.send({ from, to: lead.email, subject, html: htmlFn(lead.email), text: subject });
        await prisma.lead.update({ where: { id: lead.id }, data: { step: nextStep, lastEmailAt: new Date() } });
        sent++;
      } catch {
        // continue on error
      }
    }
  };

  await sendAndAdvance(step1Leads, 2, "Tu as encaissé quelque chose ce mois-ci ?", nurtureEmail2);
  await sendAndAdvance(step2Leads, 3, "3 erreurs qui coûtent cher aux auto-entrepreneurs", nurtureEmail3);
  await sendAndAdvance(step3Leads, 4, "79 € une fois. Pour toujours.", nurtureEmail4);

  return Response.json({ sent, step1: step1Leads.length, step2: step2Leads.length, step3: step3Leads.length });
}
