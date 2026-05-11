import nodemailer from "nodemailer";
import { Resend } from "resend";
import { escapeHtml } from "@/domain/documents/documents";
import { EmailError } from "@/lib/errors";

type EmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export async function sendEmail(input: EmailInput) {
  const from = process.env.EMAIL_FROM;
  if (!from) throw new EmailError("Service email non configuré.");

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const result = await resend.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
    if (result.error) throw new EmailError(result.error.message);
    return;
  }

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
    await transporter.sendMail({ from, ...input });
    return;
  }

  throw new EmailError("Service email non configuré.");
}

export function verificationEmail(to: string, token: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const url = `${appUrl}/verify-email?token=${encodeURIComponent(token)}`;
  return sendEmail({
    to,
    subject: "Vérifiez votre email AutoNet",
    html: `<p>Bonjour,</p><p>Confirmez votre adresse email en ouvrant ce lien :</p><p><a href="${escapeHtml(
      url
    )}">Vérifier mon email</a></p>`,
    text: `Confirmez votre adresse email : ${url}`,
  });
}

export function resetPasswordEmail(to: string, token: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const url = `${appUrl}/reset-password?token=${encodeURIComponent(token)}`;
  return sendEmail({
    to,
    subject: "Réinitialisation de votre mot de passe AutoNet",
    html: `<p>Une réinitialisation de mot de passe a été demandée.</p><p><a href="${escapeHtml(
      url
    )}">Choisir un nouveau mot de passe</a></p>`,
    text: `Choisissez un nouveau mot de passe : ${url}`,
  });
}

export function reminderEmail(input: { to: string; title: string; description?: string | null; dueDate: Date }) {
  return sendEmail({
    to: input.to,
    subject: input.title,
    html: `<p>${escapeHtml(input.title)}</p><p>${escapeHtml(input.description ?? "")}</p><p>Échéance : ${input.dueDate.toLocaleDateString(
      "fr-FR"
    )}</p>`,
    text: `${input.title}\n${input.description ?? ""}\nÉchéance : ${input.dueDate.toLocaleDateString("fr-FR")}`,
  });
}
