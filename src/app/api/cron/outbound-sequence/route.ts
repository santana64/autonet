import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { coldEmail2, coldEmail3, coldEmail4, coldEmail5 } from "@/actions/prospect";
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

  type Step = { step: number; minDays: number; subject: string; fn: (email: string, name?: string | null) => string; text: string };

  const steps: Step[] = [
    {
      step: 1, minDays: 3,
      subject: "L'erreur qui coûte 800 € aux AEs chaque année",
      fn: coldEmail2,
      text: `AutoNet calcule ton disponible réel dès l'encaissement : ${APP_URL}/calculateur`,
    },
    {
      step: 2, minDays: 4,
      subject: "Ce que disent les AEs qui utilisent AutoNet",
      fn: coldEmail3,
      text: `Créer un compte gratuit : ${APP_URL}/register`,
    },
    {
      step: 3, minDays: 6,
      subject: '"J\'ai déjà Excel pour ça"',
      fn: coldEmail4,
      text: `Tester 5 minutes : ${APP_URL}/calculateur`,
    },
    {
      step: 4, minDays: 7,
      subject: "Mon dernier message",
      fn: coldEmail5,
      text: `Offre lifetime 79 € : ${APP_URL}/register?offer=lifetime`,
    },
  ];

  let totalSent = 0;
  const breakdown: Record<string, number> = {};

  for (const s of steps) {
    const prospects = await prisma.prospect.findMany({
      where: {
        status: "contacted",
        outboundStep: s.step,
        lastEmailAt: { lte: daysAgo(s.minDays) },
      },
      take: 50,
    });

    let stepSent = 0;
    for (const p of prospects) {
      try {
        await resend.emails.send({
          from,
          to: p.email,
          subject: s.subject,
          html: s.fn(p.email, p.firstName),
          text: s.text,
        });
        await prisma.prospect.update({
          where: { id: p.id },
          data: {
            outboundStep: s.step + 1,
            lastEmailAt: new Date(),
            status: s.step === 4 ? "contacted" : "contacted",
          },
        });
        stepSent++;
        totalSent++;
      } catch { /* continue */ }
    }
    breakdown[`step${s.step + 1}`] = stepSent;
  }

  return Response.json({ totalSent, breakdown });
}
