export const ACTIVITY_CATEGORIES = [
  "GOODS_SALES",
  "SERVICE_BIC",
  "SERVICE_BNC",
  "LIBERAL_CIPAV",
  "LIBERAL_GENERAL",
  "CRAFT_SERVICE",
  "MIXED",
  "ACCOMMODATION_CLASSIFIED",
  "ACCOMMODATION_UNCLASSIFIED",
  "OTHER",
] as const;

export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number];

export type DeclarationFrequency = "MONTHLY" | "QUARTERLY";
export type PeriodType = "MONTH" | "QUARTER";
export type RevenueStatus = "COLLECTED" | "PENDING_INVOICE" | "EXCLUDED";
export type VatStatus = "FRANCHISE_BASE" | "VAT_LIABLE" | "UNKNOWN";

export const activityLabels: Record<ActivityCategory, string> = {
  GOODS_SALES: "Vente de marchandises",
  SERVICE_BIC: "Prestations de services BIC",
  SERVICE_BNC: "Prestations de services BNC",
  LIBERAL_CIPAV: "Profession libérale CIPAV",
  LIBERAL_GENERAL: "Profession libérale générale",
  CRAFT_SERVICE: "Service artisanal",
  MIXED: "Activité mixte",
  ACCOMMODATION_CLASSIFIED: "Hébergement classé",
  ACCOMMODATION_UNCLASSIFIED: "Meublé touristique non classé",
  OTHER: "Autre activité",
};

export function isServiceCategory(category: ActivityCategory) {
  return [
    "SERVICE_BIC",
    "SERVICE_BNC",
    "LIBERAL_CIPAV",
    "LIBERAL_GENERAL",
    "CRAFT_SERVICE",
    "ACCOMMODATION_UNCLASSIFIED",
    "OTHER",
  ].includes(category);
}

export function parseActivityCategory(value: FormDataEntryValue | null): ActivityCategory {
  const raw = String(value ?? "");
  if (ACTIVITY_CATEGORIES.includes(raw as ActivityCategory)) {
    return raw as ActivityCategory;
  }
  return "SERVICE_BNC";
}
