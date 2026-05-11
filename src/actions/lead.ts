"use server";

import { Resend } from "resend";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { assertRateLimit } from "@/lib/rate-limit";

const schema = z.object({ email: z.string().email("Email invalide.").max(254) });

export const FOUNDER_EMAIL = process.env.FOUNDER_EMAIL ?? "piesse917@gmail.com";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://autonet-psi.vercel.app";

export type LeadState = { ok?: boolean; error?: string };

export async function captureLeadAction(_prev: LeadState, formData: FormData): Promise<LeadState> {
  const parsed = schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: "Email invalide." };

  const { email } = parsed.data;

  try {
    await assertRateLimit(email, "leadCapture");
  } catch {
    return { ok: true }; // silently swallow — don't reveal rate limit to bots
  }

  // Save or update lead (step 1 = guide sent)
  await prisma.lead.upsert({
    where: { email },
    create: { email, step: 1, lastEmailAt: new Date() },
    update: { lastEmailAt: new Date() },
  });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: true };

  const resend = new Resend(apiKey);
  const from = process.env.EMAIL_FROM ?? "AutoNet <onboarding@resend.dev>";

  await Promise.allSettled([
    resend.emails.send({ from, to: email, subject: "Ton guide cotisations auto-entrepreneur 2026", html: guideEmail(email), text: guideEmailText() }),
    resend.emails.send({ from, to: FOUNDER_EMAIL, subject: `Nouveau lead calculateur — ${email}`, html: `<p>Nouveau lead : <strong>${email}</strong></p>`, text: `Nouveau lead : ${email}` }),
  ]);

  return { ok: true };
}

// ─── Email templates ─────────────────────────────────────────────────────────

export function guideEmail(email: string) {
  return baseEmail(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;letter-spacing:-0.025em;color:#0a0f1a;">
      Ton guide cotisations AE 2026
    </h1>
    <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.6;">
      Tu viens d'utiliser le calculateur AutoNet. Voici les taux officiels 2026 par type d'activité.
    </p>
    ${ratesTable()}
    <div style="background:#ecfdf5;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#0c8c5e;">La règle d'or</p>
      <p style="margin:0;font-size:13px;color:#064e3b;line-height:1.6;">
        Mets de côté dès l'encaissement — pas avant la déclaration. AutoNet calcule le montant exact à chaque fois.
      </p>
    </div>
    ${ctaButton("Suivre mes encaissements gratuitement", `${APP_URL}/register`)}
    <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;line-height:1.5;">
      AutoNet fournit des estimations. Toujours vérifier avec l'URSSAF ou un comptable.
    </p>
  `, email);
}

export function nurtureEmail2(email: string) {
  return baseEmail(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;letter-spacing:-0.025em;color:#0a0f1a;">
      Tu as encaissé quelque chose ce mois-ci ?
    </h1>
    <p style="margin:0 0 20px;font-size:14px;color:#64748b;line-height:1.6;">
      La plupart des auto-entrepreneurs attendent la fin du mois pour faire leurs calculs. Le problème : ils ont déjà dépensé ce qu'ils auraient dû réserver.
    </p>
    <div style="border-left:3px solid #0c8c5e;padding:12px 16px;margin-bottom:20px;background:#f8fafb;border-radius:0 8px 8px 0;">
      <p style="margin:0;font-size:14px;color:#0a0f1a;font-weight:600;">La bonne habitude</p>
      <p style="margin:6px 0 0;font-size:13px;color:#64748b;line-height:1.6;">
        Dès qu'un encaissement arrive, calcule ton disponible réel. Ça prend 30 secondes avec AutoNet.
      </p>
    </div>
    ${ctaButton("Calculer mon disponible maintenant", `${APP_URL}/calculateur`)}
  `, email);
}

export function nurtureEmail3(email: string) {
  return baseEmail(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;letter-spacing:-0.025em;color:#0a0f1a;">
      3 erreurs qui coûtent cher aux auto-entrepreneurs
    </h1>
    <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.6;">
      Après avoir parlé à des dizaines d'AEs, voici les erreurs les plus courantes.
    </p>
    ${errorBlock("1", "Se verser trop vite", "Un virement en début de mois, et plus rien pour l'URSSAF en fin de trimestre. Ça arrive à 1 AE sur 3.")}
    ${errorBlock("2", "Ne pas surveiller les seuils TVA", "Dépasser 37 500 € sans le savoir et recevoir un redressement TVA rétroactif. Le seuil est atteint sans qu'on s'en aperçoive.")}
    ${errorBlock("3", "Deviner son salaire", "\"Je me verse ce qu'il reste\" — cette phrase cache souvent une réserve URSSAF insuffisante.")}
    <p style="margin:0 0 20px;font-size:14px;color:#64748b;line-height:1.6;">
      AutoNet résout les 3 en temps réel, dès l'encaissement.
    </p>
    ${ctaButton("Créer un compte gratuit", `${APP_URL}/register`)}
  `, email);
}

export function nurtureEmail4(email: string) {
  const lifetimeUrl = process.env.NEXT_PUBLIC_LIFETIME_PAYMENT_LINK ?? `${APP_URL}/register?offer=lifetime`;
  return baseEmail(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;letter-spacing:-0.025em;color:#0a0f1a;">
      79 € une fois. Pour toujours.
    </h1>
    <p style="margin:0 0 20px;font-size:14px;color:#64748b;line-height:1.6;">
      L'offre Lifetime bêta AutoNet est encore disponible — mais limitée à 100 places.
    </p>
    <div style="background:#0a0f1a;border-radius:10px;padding:20px 24px;margin-bottom:24px;">
      <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#4ade80;">Ce que tu obtiens</p>
      ${lifetimeItem("Accès Pro complet à vie")}
      ${lifetimeItem("Prix bloqué — aucun abonnement, jamais")}
      ${lifetimeItem("Toutes les futures fonctionnalités incluses")}
      ${lifetimeItem("Retours prioritaires pour façonner le produit")}
    </div>
    <p style="margin:0 0 20px;font-size:13px;color:#64748b;line-height:1.6;">
      À 9 €/mois, AutoNet s'amortit en 9 mois. À 79 € une fois, tu ne penses plus jamais à l'abonnement.
    </p>
    ${ctaButton("Réserver ma place Lifetime — 79 €", lifetimeUrl)}
    <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;">
      Si tu préfères tester gratuitement d'abord : <a href="${APP_URL}/register" style="color:#0c8c5e;">créer un compte gratuit</a>
    </p>
  `, email);
}

export function userNudgeEmail(email: string) {
  return baseEmail(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;letter-spacing:-0.025em;color:#0a0f1a;">
      Ton cockpit t'attend
    </h1>
    <p style="margin:0 0 20px;font-size:14px;color:#64748b;line-height:1.6;">
      Tu as créé ton compte AutoNet il y a 3 jours — mais tu n'as pas encore saisi ton premier encaissement.
    </p>
    <p style="margin:0 0 20px;font-size:14px;color:#64748b;line-height:1.6;">
      C'est 2 minutes pour voir exactement combien tu peux te verser ce mois-ci, et combien mettre de côté pour l'URSSAF.
    </p>
    ${ctaButton("Saisir mon premier encaissement", `${APP_URL}/app/entries/new`)}
  `, email);
}

export function userUpgradeEmail(email: string) {
  return baseEmail(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;letter-spacing:-0.025em;color:#0a0f1a;">
      Tu utilises AutoNet — voilà ce que tu rates encore
    </h1>
    <p style="margin:0 0 20px;font-size:14px;color:#64748b;line-height:1.6;">
      Sur le plan gratuit, tu as accès au suivi de base. Voici ce que Solo débloque pour 9 €/mois :
    </p>
    ${upgradeItem("Encaissements illimités")}
    ${upgradeItem("Salaire réel calculé chaque mois")}
    ${upgradeItem("Réserve URSSAF avec airbag jours de survie")}
    ${upgradeItem("Documents récap mensuels exportables")}
    ${upgradeItem("Radar seuils TVA + micro-entreprise")}
    ${ctaButton("Passer à Solo — 9 €/mois", `${APP_URL}/app/billing`)}
    <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;">
      Résiliable à tout moment depuis ton espace compte.
    </p>
  `, email);
}

// ─── HTML helpers ─────────────────────────────────────────────────────────────

function baseEmail(body: string, email: string) {
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
    Tu reçois cet email car tu as utilisé AutoNet avec ${email}. <a href="${APP_URL}" style="color:#0c8c5e;">autonet-psi.vercel.app</a>
  </p>
</td></tr>
</table></td></tr></table></body></html>`;
}

function ctaButton(label: string, url: string) {
  return `<table cellpadding="0" cellspacing="0" style="margin-bottom:20px;"><tr><td style="background:#0c8c5e;border-radius:9999px;padding:11px 22px;">
    <a href="${url}" style="color:white;font-size:13px;font-weight:600;text-decoration:none;display:inline-block;">${label} →</a>
  </td></tr></table>`;
}

function ratesTable() {
  const rows = [
    ["Prestations BNC", "25,6 %", "2,2 %"],
    ["Prestations BIC", "21,2 %", "1,7 %"],
    ["Vente de marchandises", "12,3 %", "1,0 %"],
    ["Libéral CIPAV", "23,2 %", "2,2 %"],
    ["Artisanat / services", "21,2 %", "1,7 %"],
  ];
  return `<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:24px;">
    <tr style="background:#f1f5f9;">
      <td style="padding:8px 12px;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;">Activité</td>
      <td style="padding:8px 12px;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;text-align:right;">URSSAF</td>
      <td style="padding:8px 12px;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;text-align:right;">VL impôt</td>
    </tr>
    ${rows.map(([l, u, v]) => `<tr style="border-top:1px solid #e2e8f0;">
      <td style="padding:9px 12px;font-size:13px;color:#0a0f1a;">${l}</td>
      <td style="padding:9px 12px;font-size:13px;font-weight:600;color:#0a0f1a;text-align:right;">${u}</td>
      <td style="padding:9px 12px;font-size:13px;color:#64748b;text-align:right;">${v}</td>
    </tr>`).join("")}
  </table>`;
}

function errorBlock(num: string, title: string, desc: string) {
  return `<div style="margin-bottom:16px;padding:14px 16px;border:1px solid #e2e8f0;border-radius:8px;">
    <div style="display:flex;align-items:flex-start;gap:12px;">
      <span style="flex-shrink:0;width:22px;height:22px;background:#0a0f1a;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:white;">${num}</span>
      <div>
        <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#0a0f1a;">${title}</p>
        <p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">${desc}</p>
      </div>
    </div>
  </div>`;
}

function lifetimeItem(text: string) {
  return `<p style="margin:0 0 8px;font-size:13px;color:white;"><span style="color:#4ade80;margin-right:8px;">✓</span>${text}</p>`;
}

function upgradeItem(text: string) {
  return `<p style="margin:0 0 8px;font-size:13px;color:#0a0f1a;"><span style="color:#0c8c5e;margin-right:8px;">✓</span>${text}</p>`;
}

export function guideEmailText() {
  return `Ton guide cotisations AE 2026 — AutoNet\n\nTaux 2026 :\n- BNC : 25,6% URSSAF + 2,2% VL\n- BIC : 21,2% + 1,7%\n- Vente : 12,3% + 1,0%\n- CIPAV : 23,2% + 2,2%\n- Artisanat : 21,2% + 1,7%\n\nRègle d'or : Mets de côté dès l'encaissement.\n\nCréer un compte : ${APP_URL}/register`;
}
