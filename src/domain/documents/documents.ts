import { activityLabels, ActivityCategory } from "@/domain/activity";
import { formatFrenchDate, formatMoney, formatPercent } from "@/domain/formatting/format";
import { LEGAL_DISCLAIMER } from "@/domain/rules/default-rules";

export type DocumentBusinessProfile = {
  businessName?: string | null;
  ownerName?: string | null;
  siret?: string | null;
  siren?: string | null;
  address?: string | null;
  postalCode?: string | null;
  city?: string | null;
  documentFooterText?: string | null;
  defaultSignature?: string | null;
};

type RevenueLine = {
  activityCategory: ActivityCategory;
  revenueCents: number;
  socialCents?: number;
  trainingCents?: number;
  taxCents?: number;
};

export function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function generateMonthlyCashSummary(input: {
  profile: DocumentBusinessProfile;
  monthLabel: string;
  generatedAt: Date;
  collectedRevenueCents: number;
  recommendedReserveCents: number;
  estimatedAvailableCents: number;
  reserveHealthLabel: string;
}) {
  const title = `Synthèse cash - ${input.monthLabel}`;
  const html = documentShell(title, input.profile, input.generatedAt, `
    <h2>${escapeHtml(input.monthLabel)}</h2>
    <p>Chiffre d'affaires encaissé : <strong>${formatMoney(input.collectedRevenueCents)}</strong></p>
    <p>Montant à provisionner : <strong>${formatMoney(input.recommendedReserveCents)}</strong></p>
    <p>Argent disponible estimé : <strong>${formatMoney(input.estimatedAvailableCents)}</strong></p>
    <p>État de réserve : ${escapeHtml(input.reserveHealthLabel)}</p>
  `);
  return { title, contentHtml: html, contentText: stripHtml(html) };
}

export function generateDeclarationSummaryDocument(input: {
  profile: DocumentBusinessProfile;
  periodLabel: string;
  generatedAt: Date;
  totalRevenueCents: number;
  estimatedTotalDueCents: number;
  estimatedNetCents: number;
  lines: RevenueLine[];
  notes?: string | null;
}) {
  const title = `Synthèse de déclaration - ${input.periodLabel}`;
  const rows = input.lines
    .map(
      (line) =>
        `<tr><td>${escapeHtml(activityLabels[line.activityCategory])}</td><td>${formatMoney(
          line.revenueCents
        )}</td><td>${formatMoney((line.socialCents ?? 0) + (line.trainingCents ?? 0) + (line.taxCents ?? 0))}</td></tr>`
    )
    .join("");
  const html = documentShell(title, input.profile, input.generatedAt, `
    <h2>${escapeHtml(input.periodLabel)}</h2>
    <p>Chiffre d'affaires encaissé brut à préparer : <strong>${formatMoney(input.totalRevenueCents)}</strong></p>
    <table><thead><tr><th>Activité</th><th>CA encaissé</th><th>Montant estimé à provisionner</th></tr></thead><tbody>${rows}</tbody></table>
    <p>Total estimé à provisionner : <strong>${formatMoney(input.estimatedTotalDueCents)}</strong></p>
    <p>Disponible estimé après réserve : <strong>${formatMoney(input.estimatedNetCents)}</strong></p>
    ${input.notes ? `<p>Note : ${escapeHtml(input.notes)}</p>` : ""}
  `);
  return { title, contentHtml: html, contentText: stripHtml(html) };
}

export const generateDeclarationSummary = generateDeclarationSummaryDocument;

export function generateAnnualRevenueSummary(input: {
  profile: DocumentBusinessProfile;
  year: number;
  generatedAt: Date;
  totalRevenueCents: number;
  revenueByActivity: Partial<Record<ActivityCategory, number>>;
}) {
  const title = `Synthèse annuelle encaissée ${input.year}`;
  const rows = Object.entries(input.revenueByActivity)
    .map(
      ([category, cents]) =>
        `<tr><td>${escapeHtml(activityLabels[category as ActivityCategory])}</td><td>${formatMoney(cents ?? 0)}</td></tr>`
    )
    .join("");
  const html = documentShell(title, input.profile, input.generatedAt, `
    <p>Total encaissé brut ${input.year} : <strong>${formatMoney(input.totalRevenueCents)}</strong></p>
    <table><thead><tr><th>Activité</th><th>CA encaissé</th></tr></thead><tbody>${rows}</tbody></table>
  `);
  return { title, contentHtml: html, contentText: stripHtml(html) };
}

export function generateThresholdRadarReport(input: {
  profile: DocumentBusinessProfile;
  generatedAt: Date;
  year: number;
  totalRevenueCents: number;
  thresholdCents: number;
  usagePercent: number;
  riskLabel: string;
  vatMessage: string;
}) {
  const title = `Radar de seuils ${input.year}`;
  const html = documentShell(title, input.profile, input.generatedAt, `
    <p>Chiffre d'affaires annuel encaissé : <strong>${formatMoney(input.totalRevenueCents)}</strong></p>
    <p>Seuil micro surveillé : <strong>${formatMoney(input.thresholdCents)}</strong></p>
    <p>Utilisation : <strong>${formatPercent(input.usagePercent)}</strong> (${escapeHtml(input.riskLabel)})</p>
    <p>TVA / franchise : ${escapeHtml(input.vatMessage)}</p>
    <p>À vérifier selon votre situation, notamment en cas d'activité mixte, d'année de création ou d'option TVA.</p>
  `);
  return { title, contentHtml: html, contentText: stripHtml(html) };
}

export const generateThresholdReport = generateThresholdRadarReport;

export function generateAccountantExport(input: {
  profile: DocumentBusinessProfile;
  generatedAt: Date;
  year: number;
  totalRevenueCents: number;
  documentCount: number;
}) {
  const title = `Pack expert-comptable ${input.year}`;
  const html = documentShell(title, input.profile, input.generatedAt, `
    <p>Année : ${input.year}</p>
    <p>Chiffre d'affaires encaissé total : <strong>${formatMoney(input.totalRevenueCents)}</strong></p>
    <p>Nombre de documents AutoNet inclus : ${input.documentCount}</p>
  `);
  return { title, contentHtml: html, contentText: stripHtml(html) };
}

function documentShell(title: string, profile: DocumentBusinessProfile, generatedAt: Date, body: string) {
  const identity = [
    profile.businessName,
    profile.ownerName,
    profile.siret ? `SIRET ${profile.siret}` : null,
    [profile.address, profile.postalCode, profile.city].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .map(escapeHtml)
    .join("<br />");

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body{font-family:Arial,sans-serif;color:#061b31;line-height:1.45;margin:40px}
    h1{font-size:26px;margin-bottom:4px} h2{font-size:18px;margin-top:28px}
    table{border-collapse:collapse;width:100%;margin:20px 0} th,td{border:1px solid #d8dfe8;padding:10px;text-align:left}
    th{background:#eef4f8}.disclaimer{border-top:1px solid #d8dfe8;margin-top:32px;padding-top:16px;color:#50617a;font-size:12px}
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p>Généré le ${formatFrenchDate(generatedAt)}</p>
  <p>${identity || "Profil entreprise incomplet"}</p>
  ${body}
  <div class="disclaimer">${escapeHtml(LEGAL_DISCLAIMER)}</div>
  ${profile.documentFooterText ? `<p>${escapeHtml(profile.documentFooterText)}</p>` : ""}
  ${profile.defaultSignature ? `<p>Signature : ${escapeHtml(profile.defaultSignature)}</p>` : ""}
</body>
</html>`;
}

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
