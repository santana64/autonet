"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ACTIVITY_CATEGORIES } from "@/domain/activity";
import { calculateEntryCashBreakdown, calculateSafeAvailableMoney } from "@/domain/cashflow/cashflow";
import { eurosToCents } from "@/domain/formatting/format";
import { getRulesForYear } from "@/domain/rules/default-rules";
import { requireUser } from "@/lib/auth";
import { ValidationError, toActionError } from "@/lib/errors";
import { enforceRevenueEntryLimit } from "@/lib/plans";
import { getOrCreateDeclarationPeriod, refreshDeclarationSnapshot } from "@/lib/periods";
import { prisma } from "@/lib/prisma";
import type { ActionState } from "@/actions/auth";

const onboardingSchema = z
  .object({
    activityCategory: z.enum(ACTIVITY_CATEGORIES),
    declarationFrequency: z.enum(["MONTHLY", "QUARTERLY"]),
    taxWithholdingEnabled: z.boolean(),
    collectionDate: z.string().trim().transform((value) => new Date(value)),
    grossAmountCents: z.union([z.string(), z.number()]).transform(eurosToCents),
  })
  .superRefine((input, ctx) => {
    if (!Number.isFinite(input.collectionDate.getTime())) {
      ctx.addIssue({
        code: "custom",
        path: ["collectionDate"],
        message: "Date d'encaissement invalide.",
      });
    }
    if (input.grossAmountCents <= 0) {
      ctx.addIssue({
        code: "custom",
        path: ["grossAmountCents"],
        message: "Le montant encaissé doit être positif.",
      });
    }
  });

export async function completeOnboardingAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  let redirectTo: string | null = null;

  try {
    const user = await requireUser();
    await enforceRevenueEntryLimit(user.id);

    const input = onboardingSchema.parse({
      activityCategory: formData.get("activityCategory"),
      declarationFrequency: formData.get("declarationFrequency"),
      taxWithholdingEnabled: formData.get("taxWithholdingEnabled") === "on",
      collectionDate: formData.get("collectionDate"),
      grossAmountCents: formData.get("grossAmount"),
    });

    const profile = await prisma.businessProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        mainActivityCategory: input.activityCategory,
        activityCategories: [input.activityCategory],
        mixedActivityEnabled: false,
        declarationFrequency: input.declarationFrequency,
        vatStatus: "UNKNOWN",
        taxWithholdingEnabled: input.taxWithholdingEnabled,
        contributionRulesYear: 2026,
        conservativeReserveBufferRate: 0.05,
      },
      update: {
        mainActivityCategory: input.activityCategory,
        activityCategories: [input.activityCategory],
        mixedActivityEnabled: false,
        declarationFrequency: input.declarationFrequency,
        taxWithholdingEnabled: input.taxWithholdingEnabled,
      },
    });

    const cash = calculateEntryCashBreakdown(
      {
        activityCategory: input.activityCategory,
        grossAmountCents: input.grossAmountCents,
        status: "COLLECTED",
      },
      getRulesForYear(profile.contributionRulesYear),
      {
        taxWithholdingEnabled: profile.taxWithholdingEnabled,
        conservativeReserveBufferRate: Number(profile.conservativeReserveBufferRate),
      }
    );

    if (cash.estimatedAvailableCents <= 0) {
      throw new ValidationError("Ce montant ne laisse aucun disponible prudent. Vérifie le montant encaissé.");
    }

    const period = await getOrCreateDeclarationPeriod(user.id, input.collectionDate, input.declarationFrequency);
    const entry = await prisma.revenueEntry.create({
      data: {
        userId: user.id,
        clientName: null,
        description: "Premier encaissement",
        activityCategory: input.activityCategory,
        invoiceDate: null,
        collectionDate: input.collectionDate,
        grossAmountCents: input.grossAmountCents,
        paymentMethod: null,
        status: "COLLECTED",
        estimatedContributionCents:
          cash.socialContributionEstimateCents + cash.trainingContributionEstimateCents,
        estimatedTaxWithholdingCents: cash.taxWithholdingEstimateCents,
        estimatedReserveCents: cash.recommendedReserveCents,
        estimatedAvailableCents: cash.estimatedAvailableCents,
        declarationPeriodId: period.id,
      },
    });

    await refreshDeclarationSnapshot(user.id, period.id);

    const safeAvailableCents = calculateSafeAvailableMoney({
      bankBalanceCents: cash.grossAmountCents,
      targetReserveCents: cash.recommendedReserveCents,
      manuallyReservedCents: 0,
    });

    await prisma.cashReserveSnapshot.create({
      data: {
        userId: user.id,
        snapshotDate: input.collectionDate,
        bankBalanceCents: cash.grossAmountCents,
        manuallyReservedCents: 0,
        targetReserveCents: cash.recommendedReserveCents,
        missingReserveCents: cash.recommendedReserveCents,
        safeAvailableCents,
        notes: "Créé pendant l'onboarding.",
      },
    });

    revalidatePath("/app");
    revalidatePath("/app/onboarding");
    revalidatePath("/app/entries");
    revalidatePath("/app/declarations");
    revalidatePath("/app/reserve");
    redirectTo = `/app/onboarding?entry=${entry.id}`;
  } catch (error) {
    return toActionError(error);
  }

  redirect(redirectTo ?? "/app/onboarding");
}
