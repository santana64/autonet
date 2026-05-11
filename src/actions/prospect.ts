"use server";

import Anthropic from "@anthropic-ai/sdk";
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

// ─── AI personalization ───────────────────────────────────────────────────────

async function generateOpener(activity?: string | null, city?: string | null, firstName?: string | null): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || (!activity && !city)) return "";

  try {
    const client = new Anthropic({ apiKey: key });
    const context = [activity && `activité : ${activity}`, city && `ville : ${city}`].filter(Boolean).join(", ");
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 80,
      messages: [{
        role: "user",
        content: `Écris UNE phrase d'accroche en français pour un email froid à un auto-entrepreneur. Contexte : ${context}. Règles : naturel, pas commercial, spécifique à leur activité ou ville, 1 phrase max 120 caractères, pas de guillemets. Commence par "J'ai vu que" ou "En regardant" ou "Vu que tu" ou "Tu travailles".`,
      }],
    });
    const text = (msg.content[0] as { type: string; text: string }).text?.trim() ?? "";
    return text;
  } catch {
    return "";
  }
}

// ─── Prospect actions ─────────────────────────────────────────────────────────

export async function importProspectsAction(_prev: unknown, formData: FormData) {
  await requireFounder();
  const csv = formData.get("csv") as string;
  const autoStart = formData.get("autoStart") === "1";
  if (!csv?.trim()) return { error: "CSV vide." };

  const apiKey = process.env.RESEND_API_KEY;
  const resend = apiKey ? new Resend(apiKey) : null;
  const from = process.env.EMAIL_FROM ?? "AutoNet <onboarding@resend.dev>";

  const lines = csv.trim().split("\n").slice(1);
  let imported = 0;
  let started = 0;
  let skipped = 0;

  for (const line of lines) {
    const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const [email, firstName, lastName, city, activity] = cols;
    if (!email || !email.includes("@")) { skipped++; continue; }
    try {
      const p = await prisma.prospect.upsert({
        where: { email },
        create: { email, firstName, lastName, city, activity, source: "csv" },
        update: {},
      });
      imported++;

      if (autoStart && resend && p.outboundStep === 0 && p.status !== "unsubscribed") {
        const opener = await generateOpener(activity, city, firstName);
        await resend.emails.send({
          from,
          to: email,
          subject: "Tu calcules encore tes cotisations à la main ?",
          html: coldEmail1(email, firstName, opener),
          text: `Calcule ton disponible exact en 30 secondes : ${APP_URL}/calculateur`,
        });
        await prisma.prospect.update({
          where: { id: p.id },
          data: { status: "contacted", outboundStep: 1, lastEmailAt: new Date() },
        });
        started++;
      }
    } catch { skipped++; }
  }

  return { ok: true, imported, started, skipped };
}

export async function addProspectAction(_prev: unknown, formData: FormData) {
  await requireFounder();
  const email = (formData.get("email") as string)?.trim();
  const firstName = (formData.get("firstName") as string)?.trim();
  const lastName = (formData.get("lastName") as string)?.trim();
  const city = (formData.get("city") as string)?.trim();
  const activity = (formData.get("activity") as string)?.trim();
  const notes = (formData.get("notes") as string)?.trim();
  const autoStart = formData.get("autoStart") === "1";

  if (!email?.includes("@")) return { error: "Email invalide." };

  try {
    const p = await prisma.prospect.upsert({
      where: { email },
      create: { email, firstName, lastName, city, activity, notes, source: "manual" },
      update: { firstName, lastName, city, activity, notes },
    });

    if (autoStart) {
      const apiKey = process.env.RESEND_API_KEY;
      if (apiKey && p.outboundStep === 0 && p.status !== "unsubscribed") {
        const resend = new Resend(apiKey);
        const from = process.env.EMAIL_FROM ?? "AutoNet <onboarding@resend.dev>";
        const opener = await generateOpener(activity, city, firstName);
        await resend.emails.send({
          from,
          to: email,
          subject: "Tu calcules encore tes cotisations à la main ?",
          html: coldEmail1(email, firstName, opener),
          text: `${APP_URL}/calculateur`,
        });
        await prisma.prospect.update({
          where: { id: p.id },
          data: { status: "contacted", outboundStep: 1, lastEmailAt: new Date() },
        });
      }
    }
  } catch { return { error: "Erreur lors de l'ajout." }; }

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
  if (!prospect || prospect.status === "unsubscribed" || prospect.outboundStep > 0) return;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  const resend = new Resend(apiKey);
  const from = process.env.EMAIL_FROM ?? "AutoNet <onboarding@resend.dev>";

  try {
    const opener = await generateOpener(prospect.activity, prospect.city, prospect.firstName);
    await resend.emails.send({
      from,
      to: prospect.email,
      subject: "Tu calcules encore tes cotisations à la main ?",
      html: coldEmail1(prospect.email, prospect.firstName, opener),
      text: `${APP_URL}/calculateur`,
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
      `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(q)}&nature_juridique=1000,10&tranche_effectif_salarie=NN&per_page=25`,
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

// ─── 5-email cold sequence ────────────────────────────────────────────────────

export function coldEmail1(email: string, name?: string | null, aiOpener?: string) {
  const greeting = name ? `Bonjour ${name},` : "Bonjour,";
  const opener = aiOpener
    ? `<p style="margin:0 0 20px;font-size:14px;color:#64748b;line-height:1.6;">${aiOpener}</p>`
    : "";
  return baseProspectEmail(`
    <p style="margin:0 0 16px;font-size:14px;color:#0a0f1a;font-weight:600;">${greeting}</p>
    ${opener}
    <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;letter-spacing:-0.025em;color:#0a0f1a;">
      Tu calcules encore tes cotisations à la main ?
    </h1>
    <p style="margin:0 0 20px;font-size:14px;color:#64748b;line-height:1.6;">
      J'ai créé AutoNet pour les auto-entrepreneurs qui veulent savoir exactement combien ils peuvent se verser après chaque encaissement — URSSAF déduit, en temps réel.
    </p>
    <div style="background:#f1f5f9;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#0a0f1a;">En 30 secondes, AutoNet calcule :</p>
      <p style="margin:4px 0;font-size:13px;color:#64748b;line-height:1.8;">✓ Ton disponible réel après URSSAF</p>
      <p style="margin:4px 0;font-size:13px;color:#64748b;">✓ La réserve exacte à mettre de côté</p>
      <p style="margin:4px 0;font-size:13px;color:#64748b;">✓ L'alerte quand tu approches les seuils TVA</p>
    </div>
    <p style="margin:0 0 20px;font-size:14px;color:#64748b;line-height:1.6;">
      C'est gratuit, sans CB. 2 minutes à configurer.
    </p>
    ${prospectCta("Essayer AutoNet gratuitement →", `${APP_URL}/register`)}
    <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;">
      Si tu gères déjà ça parfaitement, réponds-moi "stop" — je te retire de ma liste.
    </p>
  `, email);
}

export function coldEmail2(email: string, name?: string | null) {
  const hi = name ? `${name}, ` : "";
  return baseProspectEmail(`
    <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;letter-spacing:-0.025em;color:#0a0f1a;">
      L'erreur qui coûte 800 € aux AEs chaque année
    </h1>
    <p style="margin:0 0 20px;font-size:14px;color:#64748b;line-height:1.6;">
      ${hi}je t'ai écrit il y a quelques jours. Une chose que j'entends tout le temps des auto-entrepreneurs :
    </p>
    <div style="border-left:3px solid #e2e8f0;padding:12px 16px;margin-bottom:20px;background:#f8fafb;border-radius:0 8px 8px 0;">
      <p style="margin:0;font-size:14px;color:#64748b;font-style:italic;line-height:1.6;">"Je me verse ce qu'il reste sur le compte à la fin du mois."</p>
    </div>
    <p style="margin:0 0 16px;font-size:14px;color:#64748b;line-height:1.6;">
      Le problème : ce "ce qui reste" inclut la réserve URSSAF du trimestre suivant. Quand la déclaration arrive, il manque souvent entre 600 et 1 200 €.
    </p>
    <div style="background:#fef2f2;border-radius:8px;padding:14px 18px;margin-bottom:20px;border:1px solid #fecaca;">
      <p style="margin:0;font-size:13px;color:#991b1b;font-weight:600;">Résultat concret</p>
      <p style="margin:6px 0 0;font-size:13px;color:#7f1d1d;line-height:1.6;">Piocher dans les économies personnelles, ou pire — payer en retard et déclencher des pénalités URSSAF.</p>
    </div>
    <p style="margin:0 0 20px;font-size:14px;color:#0a0f1a;font-weight:600;">
      AutoNet calcule ton disponible réel dès l'encaissement. Plus jamais de mauvaise surprise.
    </p>
    ${prospectCta("Voir comment ça marche →", `${APP_URL}/calculateur`)}
  `, email);
}

export function coldEmail3(email: string, name?: string | null) {
  const hi = name ? `${name}, ` : "";
  return baseProspectEmail(`
    <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;letter-spacing:-0.025em;color:#0a0f1a;">
      Ce que disent les AEs qui utilisent AutoNet
    </h1>
    <p style="margin:0 0 20px;font-size:14px;color:#64748b;line-height:1.6;">
      ${hi}je sais que tu es occupé. Voici ce qui a convaincu des AEs dans la même situation que toi.
    </p>
    ${testimonial("Développeur freelance, Lyon", "Je passais 2h par trimestre à vérifier mes calculs avant chaque déclaration. Maintenant je regarde AutoNet, je sais exactement quoi déclarer.")}
    ${testimonial("Consultante RH, Paris", "Le mode salaire m'a changé la vie. Je sais chaque mois combien je peux me verser sans stress URSSAF.")}
    ${testimonial("Graphiste indépendante, Bordeaux", "J'avais toujours peur de dépasser les seuils TVA sans m'en rendre compte. AutoNet m'alerte en temps réel.")}
    <p style="margin:20px 0;font-size:14px;color:#64748b;line-height:1.6;">
      Compte gratuit, aucune CB demandée.
    </p>
    ${prospectCta("Créer mon compte gratuit →", `${APP_URL}/register`)}
  `, email);
}

export function coldEmail4(email: string, name?: string | null) {
  const hi = name ? `${name}, ` : "";
  return baseProspectEmail(`
    <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;letter-spacing:-0.025em;color:#0a0f1a;">
      "J'ai déjà Excel pour ça"
    </h1>
    <p style="margin:0 0 20px;font-size:14px;color:#64748b;line-height:1.6;">
      ${hi}c'est l'objection que j'entends le plus souvent. Et honnêtement — si tu as un tableur qui tourne bien, c'est bien.
    </p>
    <p style="margin:0 0 16px;font-size:14px;color:#64748b;line-height:1.6;">
      La différence avec AutoNet :
    </p>
    ${diffItem("Excel", "Tu dois penser à mettre à jour tes taux chaque année (ils changent). Tu peux te tromper. Tu dois faire la saisie toi-même.")}
    ${diffItem("AutoNet", "Taux 2026 intégrés et mis à jour automatiquement. Calcul instantané dès que tu saisis un encaissement. Zéro formule à maintenir.")}
    <p style="margin:20px 0;font-size:14px;color:#64748b;line-height:1.6;">
      Essaie 5 minutes — si tu ne vois pas la différence, ton Excel est probablement meilleur que le mien.
    </p>
    ${prospectCta("Tester 5 minutes →", `${APP_URL}/calculateur`)}
  `, email);
}

export function coldEmail5(email: string, name?: string | null) {
  const lifetimeUrl = process.env.NEXT_PUBLIC_LIFETIME_PAYMENT_LINK ?? `${APP_URL}/register?offer=lifetime`;
  const hi = name ? `${name}` : "toi";
  return baseProspectEmail(`
    <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;letter-spacing:-0.025em;color:#0a0f1a;">
      Mon dernier message, ${hi}
    </h1>
    <p style="margin:0 0 20px;font-size:14px;color:#64748b;line-height:1.6;">
      Je t'ai envoyé 4 emails sur AutoNet. Je ne vais pas continuer si ce n'est pas pour toi — mais je voulais te dire une dernière chose avant de partir.
    </p>
    <div style="background:#0a0f1a;border-radius:10px;padding:20px 24px;margin-bottom:24px;">
      <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#4ade80;">Offre bêta — limitée à 100 places</p>
      <p style="margin:0 0 4px;font-size:22px;font-weight:700;color:white;">79 € une fois</p>
      <p style="margin:0 0 14px;font-size:13px;color:#94a3b8;">Accès Pro à vie. Aucun abonnement, jamais.</p>
      <p style="margin:4px 0;font-size:13px;color:#e2e8f0;">✓ Encaissements illimités</p>
      <p style="margin:4px 0;font-size:13px;color:#e2e8f0;">✓ Toutes les futures fonctionnalités incluses</p>
      <p style="margin:4px 0;font-size:13px;color:#e2e8f0;">✓ Accès prioritaire pour façonner le produit</p>
    </div>
    <p style="margin:0 0 20px;font-size:13px;color:#64748b;line-height:1.6;">
      À 9 €/mois, AutoNet s'amortit en 9 mois. À 79 € une fois, tu n'y penses plus jamais.
    </p>
    ${prospectCta("Réserver ma place Lifetime — 79 €", lifetimeUrl)}
    <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;">
      Tu préfères tester gratuitement d'abord : <a href="${APP_URL}/register" style="color:#0c8c5e;">créer un compte gratuit</a> — ou réponds "stop" et je te retire immédiatement.
    </p>
  `, email);
}

// ─── HTML helpers ─────────────────────────────────────────────────────────────

function testimonial(author: string, quote: string) {
  return `<div style="margin-bottom:14px;padding:14px 16px;background:#f8fafb;border-radius:8px;border:1px solid #e2e8f0;">
    <p style="margin:0 0 8px;font-size:13px;color:#0a0f1a;line-height:1.6;">"${quote}"</p>
    <p style="margin:0;font-size:11px;color:#94a3b8;font-weight:600;">— ${author}</p>
  </div>`;
}

function diffItem(label: string, text: string) {
  const isAutoNet = label === "AutoNet";
  return `<div style="margin-bottom:10px;padding:12px 16px;border-radius:8px;background:${isAutoNet ? "#ecfdf5" : "#f8fafb"};border:1px solid ${isAutoNet ? "#bbf7d0" : "#e2e8f0"};">
    <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:${isAutoNet ? "#0c8c5e" : "#94a3b8"};text-transform:uppercase;letter-spacing:0.05em;">${label}</p>
    <p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">${text}</p>
  </div>`;
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
    Email envoyé à ${email}. <a href="${APP_URL}" style="color:#0c8c5e;">autonet-psi.vercel.app</a>
  </p>
</td></tr>
</table></td></tr></table></body></html>`;
}
