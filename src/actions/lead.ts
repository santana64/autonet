"use server";

import { Resend } from "resend";
import { z } from "zod";

const schema = z.object({ email: z.string().email("Email invalide.") });

const FOUNDER_EMAIL = "piesse917@gmail.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://autonet-psi.vercel.app";

export type LeadState = { ok?: boolean; error?: string };

export async function captureLeadAction(_prev: LeadState, formData: FormData): Promise<LeadState> {
  const parsed = schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: "Email invalide." };

  const { email } = parsed.data;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: true }; // silently succeed in dev

  const resend = new Resend(apiKey);
  const from = process.env.EMAIL_FROM ?? "AutoNet <onboarding@resend.dev>";

  await Promise.allSettled([
    resend.emails.send({
      from,
      to: email,
      subject: "Ton guide cotisations auto-entrepreneur 2026",
      html: guideEmail(email),
      text: guideEmailText(),
    }),
    resend.emails.send({
      from,
      to: FOUNDER_EMAIL,
      subject: `Nouveau lead calculateur — ${email}`,
      html: `<p>Nouveau lead depuis le calculateur AutoNet : <strong>${email}</strong></p>`,
      text: `Nouveau lead : ${email}`,
    }),
  ]);

  return { ok: true };
}

function guideEmail(email: string) {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0a0f1a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafb;padding:40px 20px;">
    <tr><td>
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
        <!-- Header -->
        <tr><td style="background:#0a0f1a;padding:24px 32px;">
          <div style="display:inline-flex;align-items:center;gap:10px;">
            <div style="width:28px;height:28px;background:#0c8c5e;border-radius:7px;display:inline-flex;align-items:center;justify-content:center;">
              <span style="color:white;font-size:10px;font-weight:900;">AN</span>
            </div>
            <span style="color:white;font-size:15px;font-weight:700;letter-spacing:-0.02em;">AutoNet</span>
          </div>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;letter-spacing:-0.025em;color:#0a0f1a;">
            Ton guide cotisations AE 2026
          </h1>
          <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.6;">
            Tu viens d'utiliser le calculateur AutoNet. Voici les taux officiels 2026 selon ton type d'activité.
          </p>

          <!-- Rates table -->
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:24px;">
            <tr style="background:#f1f5f9;">
              <td style="padding:10px 14px;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;">Activité</td>
              <td style="padding:10px 14px;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;text-align:right;">URSSAF</td>
              <td style="padding:10px 14px;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;text-align:right;">VL impôt</td>
            </tr>
            ${rateRow("Prestations BNC", "25,6 %", "2,2 %")}
            ${rateRow("Prestations BIC", "21,2 %", "1,7 %")}
            ${rateRow("Vente de marchandises", "12,3 %", "1,0 %")}
            ${rateRow("Libéral CIPAV", "23,2 %", "2,2 %")}
            ${rateRow("Artisanat / services", "21,2 %", "1,7 %")}
          </table>

          <!-- Tips -->
          <div style="background:#ecfdf5;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
            <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#0c8c5e;">La règle d'or</p>
            <p style="margin:0;font-size:13px;color:#064e3b;line-height:1.6;">
              Mets de côté dès l'encaissement — pas avant la déclaration. AutoNet calcule le montant exact à chaque fois.
            </p>
          </div>

          <!-- CTA -->
          <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr><td style="background:#0c8c5e;border-radius:9999px;padding:12px 24px;">
              <a href="${APP_URL}/register" style="color:white;font-size:13px;font-weight:600;text-decoration:none;display:inline-block;">
                Suivre mes encaissements gratuitement →
              </a>
            </td></tr>
          </table>

          <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.5;">
            AutoNet fournit des estimations. Les montants exacts dépendent de ta situation — toujours vérifier avec l'URSSAF ou un comptable.
          </p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:16px 32px;border-top:1px solid #e2e8f0;">
          <p style="margin:0;font-size:11px;color:#94a3b8;">
            Tu reçois cet email car tu as utilisé le calculateur AutoNet avec l'adresse ${email}.
            <a href="${APP_URL}" style="color:#0c8c5e;">autonet-psi.vercel.app</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function rateRow(label: string, urssaf: string, vl: string) {
  return `<tr style="border-top:1px solid #e2e8f0;">
    <td style="padding:10px 14px;font-size:13px;color:#0a0f1a;">${label}</td>
    <td style="padding:10px 14px;font-size:13px;font-weight:600;color:#0a0f1a;text-align:right;">${urssaf}</td>
    <td style="padding:10px 14px;font-size:13px;color:#64748b;text-align:right;">${vl}</td>
  </tr>`;
}

function guideEmailText() {
  return `Ton guide cotisations AE 2026 — AutoNet

Taux officiels 2026 :
- Prestations BNC : 25,6% URSSAF + 2,2% VL impôt
- Prestations BIC : 21,2% + 1,7%
- Vente de marchandises : 12,3% + 1,0%
- Libéral CIPAV : 23,2% + 2,2%
- Artisanat : 21,2% + 1,7%

Règle d'or : Mets de côté dès l'encaissement.

Créer un compte gratuit : ${APP_URL}/register

AutoNet fournit des estimations à vérifier selon ta situation.`;
}
