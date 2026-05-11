import { format } from "date-fns";
import { fr } from "date-fns/locale";

export function formatMoney(cents: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function formatFrenchDate(date: Date | string | null | undefined) {
  if (!date) return "Non défini";
  return format(new Date(date), "dd MMMM yyyy", { locale: fr });
}

export function formatShortDate(date: Date | string | null | undefined) {
  if (!date) return "Non défini";
  return format(new Date(date), "dd/MM/yyyy", { locale: fr });
}

export function formatPercent(value: number, digits = 1) {
  return `${value.toLocaleString("fr-FR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })} %`;
}

export function eurosToCents(value: string | number | null | undefined) {
  const normalized = String(value ?? "0").replace(",", ".").replace(/\s/g, "");
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed)) return 0;
  return Math.round(parsed * 100);
}

export function centsToInput(cents: number | null | undefined) {
  return ((cents ?? 0) / 100).toFixed(2);
}
