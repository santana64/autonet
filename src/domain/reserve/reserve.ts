import { CashEntryInput, calculatePeriodCashBreakdown, CashflowProfile } from "@/domain/cashflow/cashflow";
import { RulesConfiguration } from "@/domain/rules/default-rules";

export type ReserveEventInput = {
  type: "SET_ASIDE" | "RELEASED" | "ADJUSTMENT";
  amountCents: number;
};

export function calculateTargetReserve(
  entries: CashEntryInput[],
  rules: RulesConfiguration,
  profile: CashflowProfile
) {
  return calculatePeriodCashBreakdown(entries, rules, profile).recommendedReserveCents;
}

export function calculateMissingReserve(targetReserveCents: number, manuallyReservedCents: number) {
  return Math.max(0, targetReserveCents - manuallyReservedCents);
}

export function applyReserveEvent(currentReserveCents: number, event: ReserveEventInput) {
  if (event.type === "SET_ASIDE") return currentReserveCents + Math.max(0, event.amountCents);
  if (event.type === "RELEASED") return Math.max(0, currentReserveCents - Math.max(0, event.amountCents));
  return Math.max(0, event.amountCents);
}

export function getReserveRecommendation(context: {
  targetReserveCents: number;
  manuallyReservedCents: number;
  bankBalanceCents?: number | null;
}) {
  const missingReserveCents = calculateMissingReserve(context.targetReserveCents, context.manuallyReservedCents);
  const safeAvailableCents = Math.max(0, (context.bankBalanceCents ?? 0) - missingReserveCents);
  return {
    targetReserveCents: context.targetReserveCents,
    manuallyReservedCents: context.manuallyReservedCents,
    missingReserveCents,
    safeAvailableCents,
    message:
      missingReserveCents > 0
        ? "Mettez ce montant de côté avant de considérer l'argent comme disponible."
        : "Votre réserve couvre l'estimation actuelle.",
  };
}
