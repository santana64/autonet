"use server";

import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { APP_URL, FOUNDER_EMAIL } from "@/actions/lead";
import { redirect } from "next/navigation";

const FOUNDER = FOUNDER_EMAIL;

async function requireFounder() {
  const user = await getCurrentUser();
  if (!user || user.email !== FOUNDER) redirect("/");
}

// ─── Prospect actions ─────────────────────────────────────────────────────────

export async function importProspectsAction(_prev: unknown, formData: FormData) {
  await requireFounder();
  const csv = formData.get("csv") as string;
  if (!csv?.trim()) return { error: "CSV vide." };

  const lines = csv.trim().split("\n").slice(1); // skip header
  let imported = 0;
  let skipped = 0;

  for (const line of lines) {
    const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const [email, firstName, lastName, city, activity] = cols;
    if (!email || !email.includes("@")) { skipped++; continue; }
    try {
      await prisma.prospect.upsert({
        where: { email },
        create: { email, firstName, lastName, city, activity, source: "csv" },
        update: {},
      });
      imported++;
    } catch { skipped++; }
  }

  return { ok: true, imported, skipped };
}

export async function addProspectAction(_prev: unknown, formData: FormData) {
  await requireFounder();
  const email = (formData.get("email") as string)?.trim();
  const firstName = (formData.get("firstName") as string)?.trim();
  const lastName = (formData.get("lastName") as string)?.trim();
  const city = (formData.get("city") as string)?.trim();
  const activity = (formData.get("activity") as string)?.trim();
  const notes = (formData.get("notes") as string)?.trim();

  if (!email?.includes("@")) return { error: "Email invalide." };

  try {
    await prisma.prospect.upsert({
      where: { email },
      create: { email, firstName, lastName, city, activity, notes, source: "manual" },
      update: { firstName, lastName, city, activity, notes },
    });
  } catch { return { error: "Email déjà existant." }; }

  return { ok: true };
}

export async function deleteProspectAction(id: string) {
  await requireFounder();
  await prisma.prospect.delete({ where: { id } });
}

export async function unsubscribeProspectAction(id: string) {
  await requireFounder();
  await prisma.prospect.update({ where: { id }, data: { status: "unsubscribed" } });
}

export async function markRepliedAction(id: string) {
  await requireFounder();
  await prisma.prospect.update({ where: { id }, data: { status: "replied" } });
}

export async function markConvertedAction(id: string) {
  await requireFounder();
  await prisma.prospect.update({ where: { id }, data: { status: "converted" } });
}

export async function startSequenceAction(id: string) {
  await requireFounder();
  const prospect = await prisma.prospect.findUnique({ where: { id } });
  if (!prospect || prospect.status === "unsubscribed") return;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  const resend = new Resend(apiKey);
  const from = process.env.EMAIL_FROM ?? "AutoNet <onboarding@resend.dev>";

  try {
    await resend.emails.send({
      from,
      to: prospect.email,
      subject: "Tu calcules encore tes cotisations à la main ?",
      html: coldEmail1(prospect.email, prospect.firstName),
      text: `Calcule ton disponible exact en 30 secondes : ${APP_URL}/calculateur`,
    });
    await prisma.prospect.update({
      where: { id },
      data: { status: "contacted", outboundStep: 1, lastEmailAt: new Date() },
    });
  } catch { /* continue */ }
}

export async function searchSireneAction(_prev: unknown, formData: FormData) {
  await requireFounder();
  const q = (formData.get("q") as string)?.trim();
  if (!q) return { results: [] };

  try {
    const res = await fetch(
      `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(q)}&nature_juridique=1000,10&tranche_effectif_salarie=NN&per_page=20`,
      { next: { revalidate: 0 } }
    );
    if (!res.ok) return { results: [] };
    const data = await res.json();
    const results = (data.results ?? []).map((e: SireneResult) => ({
      siret: e.siege?.siret ?? "",
      name: e.nom_complet ?? "",
      activity: e.activite_principale ?? "",
      city: e.siege?.libelle_commune ?? "",
      registeredAt: e.date_creation ?? "",
    }));
    return { results };
  } catch {
    return { results: [] };
  }
}

type SireneResult = {
  siege?: { siret?: string; libelle_commune?: string };
  nom_complet?: string;
  activite_principale?: string;
  date_creation?: string;
};

// ─── Email templates ──────────────────────────────────────────────────────────

function firstName(name?: string | null) {
  return name ? `, ${name}` : "";
}

export function coldEmail1(email: string, name?: string | null) {
  return baseProspectEmail(`
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;letter-spacing:-0.025em;color:#0a0f1a;">
      Tu calcules encore tes cotisations à la main${firstName(name)} ?
    </h1>
    <p style="margin:0 0 20px;font-size:14px;color:#64748b;line-height:1.6;">
      J'ai créé AutoNet pour les auto-entrepreneurs qui veulent savoir exactement combien ils peuvent se verser après chaque encaissement — sans tableur, sans surprise URSSAF.
    </p>
    <div style="background:#f1f5f9;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
      <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#0a0f1a;">En 30 secondes, AutoNet te calcule :</p>
      <p style="margin:0;font-size:13px;color:#64748b;line-height:1.8;">
        ✓ Ton disponible réel après URSSAF<br>
        ✓ La réserve exacte à mettre de côté<br>
        ✓ Ton taux de cotisation selon ton activité
      </p>
    </div>
    <p style="margin:0 0 20px;font-size:14px;color:#64748b;line-height:1.6;">
      C'est gratuit, sans CB, et ça prend 2 minutes à configurer.
    </p>
    ${prospectCta("Essayer AutoNet gratuitement", `${APP_URL}/register`)}
    <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;">
      Si tu gères déjà ça parfaitement, dis-le moi — je te retire de ma liste.
    </p>
  `, email);
}

export function coldEmail2(email: string, name?: string | null) {
  return baseProspectEmail(`
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;letter-spacing:-0.025em;color:#0a0f1a;">
      3 AE sur 4 se trompent sur ce montant${firstName(name)}
    </h1>
    <p style="margin:0 0 20px;font-size:14px;color:#64748b;line-height:1.6;">
      Je t'ai écrit il y a quelques jours. Une chose que j'entends souvent des auto-entrepreneurs :
    </p>
    <div style="border-left:3px solid #e2e8f0;padding:12px 16px;margin-bottom:20px;color:#64748b;font-size:13px;font-style:italic;line-height:1.6;">
      "Je me verse ce qu'il reste sur le compte à la fin du mois."
    </div>
    <p style="margin:0 0 20px;font-size:14px;color:#64748b;line-height:1.6;">
      Le problème : ce "ce qui reste" inclut la réserve URSSAF du trimestre suivant. Résultat — la déclaration arrive, il n'y a pas assez, et il faut piocher dans les économies.
    </p>
    <p style="margin:0 0 20px;font-size:14px;color:#0a0f1a;font-weight:600;line-height:1.6;">
      AutoNet calcule ton disponible réel dès l'encaissement, URSSAF déduit.
    </p>
    ${prospectCta("Voir comment ça marche (2 min)", `${APP_URL}/calculateur`)}
  `, email);
}

export function coldEmail3(email: string, name?: string | null) {
  return baseProspectEmail(`
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;letter-spacing:-0.025em;color:#0a0f1a;">
      Dernière chose${firstName(name)} (je te laisse tranquille après)
    </h1>
    <p style="margin:0 0 20px;font-size:14px;color:#64748b;line-height:1.6;">
      Je t'ai contacté deux fois cette semaine. Je ne veux pas être lourd — c'est mon dernier message.
    </p>
    <p style="margin:0 0 20px;font-size:14px;color:#64748b;line-height:1.6;">
      AutoNet est gratuit à l'essai. Pas de CB demandée, pas d'engagement. Si après 10 minutes tu ne vois pas l'intérêt, je comprends.
    </p>
    <div style="background:#ecfdf5;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
      <p style="margin:0;font-size:13px;color:#064e3b;line-height:1.6;">
        <strong>Ce que tu peux faire maintenant :</strong> saisis un encaissement fictif sur le calculateur — tu verras en 30 secondes exactement ce qu'AutoNet fait.
      </p>
    </div>
    ${prospectCta("Tester le calculateur →", `${APP_URL}/calculateur`)}
    <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;">
      Tu ne veux plus recevoir ces emails ? Réponds "stop" et je te retire immédiatement.
    </p>
  `, email);
}

function prospectCta(label: string, url: string) {
  return `<table cellpadding="0" cellspacing="0" style="margin-bottom:20px;"><tr><td style="background:#0c8c5e;border-radius:9999px;padding:11px 22px;">
    <a href="${url}" style="color:white;font-size:13px;font-weight:600;text-decoration:none;display:inline-block;">${label}</a>
  </td></tr></table>`;
}

function baseProspectEmail(body: string, email: string) {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0a0f1a;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafb;padding:40px 20px;"><tr><td>
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
<tr><td style="background:#0a0f1a;padding:20px 28px;">
  <span style="color:white;font-size:14px;font-weight:700;letter-spacing:-0.02em;">AutoNet</span>
</td></tr>
<tr><td style="padding:28px;">${body}</td></tr>
<tr><td style="padding:14px 28px;border-top:1px solid #e2e8f0;">
  <p style="margin:0;font-size:11px;color:#94a3b8;">
    Cet email a été envoyé à ${email}. <a href="${APP_URL}" style="color:#0c8c5e;">autonet-psi.vercel.app</a>
  </p>
</td></tr>
</table></td></tr></table></body></html>`;
}
