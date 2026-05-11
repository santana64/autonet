import { Plan } from "@/domain/billing/plans";

export const declarationStatusLabels = {
  OPEN: "À préparer",
  READY: "Prête",
  DECLARED: "Déclarée",
  PAID: "Payée",
  LATE: "En retard",
} as const;

export const declarationActionLabels = {
  READY: "prête",
  DECLARED: "déclarée",
  PAID: "payée",
} as const;

export const documentTypeLabels = {
  MONTHLY_CASH_SUMMARY: "Récap mensuel",
  DECLARATION_SUMMARY: "Récap déclaration",
  ANNUAL_REVENUE_SUMMARY: "Synthèse annuelle",
  THRESHOLD_RADAR_REPORT: "Radar de seuils",
  ACCOUNTANT_EXPORT: "Export expert-comptable",
} as const;

export const reserveEventTypeLabels = {
  SET_ASIDE: "Mis de côté",
  RELEASED: "Libéré",
  ADJUSTMENT: "Ajustement",
} as const;

export const revenueStatusLabels = {
  COLLECTED: "Encaissé",
  PENDING_INVOICE: "En attente",
  EXCLUDED: "Exclu",
} as const;

export const reminderTypeLabels = {
  DECLARATION_DUE: "Déclaration",
  RESERVE_MISSING: "Réserve",
  THRESHOLD_WARNING: "Seuil",
  VAT_WARNING: "TVA",
  CUSTOM: "Personnalisé",
} as const;

export const reminderStatusLabels = {
  PENDING: "À faire",
  DONE: "Terminé",
  CANCELLED: "Annulé",
} as const;

export const planLabels: Record<Plan, string> = {
  FREE: "Free",
  STARTER: "Solo",
  PRO: "Pro",
  CABINET: "Cabinet",
};

export function labelFromMap<T extends Record<string, string>>(labels: T, value: string) {
  return labels[value as keyof T] ?? value;
}
