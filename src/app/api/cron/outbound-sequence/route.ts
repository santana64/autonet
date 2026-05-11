import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { coldEmail2, coldEmail3 } from "@/actions/prospect";
import { APP_URL } from "@/actions/lead";

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

  let sent = 0;

  // Email 2 — J+3 after first email
  const step1 = await prisma.prospect.findMany({
    where: {
      status: "contacted",
      outboundStep: 1,
      lastEmailAt: { lte: daysAgo(3) },
    },
    take: 50,
  });

  for (const p of step1) {
    try {
      await resend.emails.send({
        from,
        to: p.email,
        subject: "3 AE sur 4 se trompent sur ce montant",
        html: coldEmail2(p.email, p.firstName),
        text: `AutoNet calcule ton disponible réel dès l'encaissement : ${APP_URL}/calculateur`,
      });
      await prisma.prospect.update({
        where: { id: p.id },
        data: { outboundStep: 2, lastEmailAt: new Date() },
      });
      sent++;
    } catch { /* continue */ }
  }

  // Email 3 — J+7 after second email
  const step2 = await prisma.prospect.findMany({
    where: {
      status: "contacted",
      outboundStep: 2,
      lastEmailAt: { lte: daysAgo(4) },
    },
    take: 50,
  });

  for (const p of step2) {
    try {
      await resend.emails.send({
        from,
        to: p.email,
        subject: "Dernière chose (je te laisse tranquille après)",
        html: coldEmail3(p.email, p.firstName),
        text: `Tester AutoNet gratuitement : ${APP_URL}/register`,
      });
      await prisma.prospect.update({
        where: { id: p.id },
        data: { outboundStep: 3, lastEmailAt: new Date() },
      });
      sent++;
    } catch { /* continue */ }
  }

  return Response.json({ sent, step1: step1.length, step2: step2.length });
}
