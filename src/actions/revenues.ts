"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { calculateEntryCashBreakdown } from "@/domain/cashflow/cashflow";
import { getRulesForYear } from "@/domain/rules/default-rules";
import { requireUser } from "@/lib/auth";
import { NotFoundError, ValidationError, toActionError } from "@/lib/errors";
import { enforceRevenueEntryLimit } from "@/lib/plans";
import { getOrCreateDeclarationPeriod, refreshDeclarationSnapshot } from "@/lib/periods";
import { prisma } from "@/lib/prisma";
import { revenueSchema } from "@/lib/validation";
import type { ActionState } from "@/actions/auth";

export async function createRevenueAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  let redirectTo: string | null = null;
  try {
    const user = await requireUser();
    await enforceRevenueEntryLimit(user.id);
    const profile = await prisma.businessProfile.findUnique({ where: { userId: user.id } });
    if (!profile) throw new NotFoundError("Profil activité incomplet.");
    const input = revenueSchema.parse(readRevenueForm(formData));
    if (input.grossAmountCents <= 0) throw new ValidationError("Le montant encaissé doit étre positif.");
    const client = input.clientId
      ? await prisma.client.findFirst({ where: { id: input.clientId, userId: user.id } })
      : null;
    if (input.clientId && !client) throw new NotFoundError("Client introuvable.");
    const period =
      input.status === "COLLECTED"
        ? await getOrCreateDeclarationPeriod(user.id, input.collectionDate, profile.declarationFrequency)
        : null;
    const cash = calculateEntryCashBreakdown(input, getRulesForYear(profile.contributionRulesYear), {
      taxWithholdingEnabled: profile.taxWithholdingEnabled,
      conservativeReserveBufferRate: Number(profile.conservativeReserveBufferRate),
    });

    const entry = await prisma.revenueEntry.create({
      data: {
        userId: user.id,
        ...input,
        estimatedContributionCents:
          cash.socialContributionEstimateCents + cash.trainingContributionEstimateCents,
        estimatedTaxWithholdingCents: cash.taxWithholdingEstimateCents,
        estimatedReserveCents: cash.recommendedReserveCents,
        estimatedAvailableCents: cash.estimatedAvailableCents,
        clientName: client?.name ?? input.clientName,
        declarationPeriodId: period?.id,
      },
    });
    if (period) await refreshDeclarationSnapshot(user.id, period.id);
    redirectTo = `/app/entries?created=${entry.id}`;
    revalidatePath("/app/entries");
    revalidatePath("/app");
  } catch (error) {
    return toActionError(error);
  }
  redirect(redirectTo ?? "/app/entries");
}

export async function updateRevenueAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  let redirectTo: string | null = null;
  try {
    const user = await requireUser();
    const id = String(formData.get("id") ?? "");
    const existing = await prisma.revenueEntry.findFirst({ where: { id, userId: user.id } });
    if (!existing) throw new NotFoundError("Entrée de chiffre d'affaires introuvable.");
    const profile = await prisma.businessProfile.findUnique({ where: { userId: user.id } });
    if (!profile) throw new NotFoundError("Profil activité incomplet.");
    const input = revenueSchema.parse(readRevenueForm(formData));
    if (input.grossAmountCents <= 0) throw new ValidationError("Le montant encaissé doit étre positif.");
    const client = input.clientId
      ? await prisma.client.findFirst({ where: { id: input.clientId, userId: user.id } })
      : null;
    if (input.clientId && !client) throw new NotFoundError("Client introuvable.");
    const period =
      input.status === "COLLECTED"
        ? await getOrCreateDeclarationPeriod(user.id, input.collectionDate, profile.declarationFrequency)
        : null;
    const cash = calculateEntryCashBreakdown(input, getRulesForYear(profile.contributionRulesYear), {
      taxWithholdingEnabled: profile.taxWithholdingEnabled,
      conservativeReserveBufferRate: Number(profile.conservativeReserveBufferRate),
    });

    await prisma.revenueEntry.update({
      where: { id },
      data: {
        ...input,
        estimatedContributionCents:
          cash.socialContributionEstimateCents + cash.trainingContributionEstimateCents,
        estimatedTaxWithholdingCents: cash.taxWithholdingEstimateCents,
        estimatedReserveCents: cash.recommendedReserveCents,
        estimatedAvailableCents: cash.estimatedAvailableCents,
        clientName: client?.name ?? input.clientName,
        declarationPeriodId: period?.id ?? null,
      },
    });
    if (period) await refreshDeclarationSnapshot(user.id, period.id);
    if (existing.declarationPeriodId && existing.declarationPeriodId !== period?.id) {
      await refreshDeclarationSnapshot(user.id, existing.declarationPeriodId);
    }
    revalidatePath("/app/entries");
    revalidatePath("/app/declarations");
    redirectTo = "/app/entries";
  } catch (error) {
    return toActionError(error);
  }
  redirect(redirectTo ?? "/app/entries");
}

export async function deleteRevenueAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const existing = await prisma.revenueEntry.findFirst({ where: { id, userId: user.id } });
  if (!existing) throw new NotFoundError("Entrée de chiffre d'affaires introuvable.");
  await prisma.revenueEntry.delete({ where: { id } });
  if (existing.declarationPeriodId) await refreshDeclarationSnapshot(user.id, existing.declarationPeriodId);
  revalidatePath("/app/entries");
  revalidatePath("/app/declarations");
}

function readRevenueForm(formData: FormData) {
  return {
    clientId: formData.get("clientId"),
    clientName: formData.get("clientName"),
    description: formData.get("description"),
    activityCategory: formData.get("activityCategory"),
    invoiceDate: formData.get("invoiceDate"),
    collectionDate: formData.get("collectionDate"),
    grossAmountCents: formData.get("grossAmount"),
    paymentMethod: formData.get("paymentMethod"),
    status: formData.get("status"),
    notes: formData.get("notes"),
  };
}
