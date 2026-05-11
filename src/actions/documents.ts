"use server";

import { endOfMonth, startOfMonth } from "date-fns";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { calculatePeriodCashBreakdown, calculateReserveHealth } from "@/domain/cashflow/cashflow";
import { calculateDeclarationSnapshot } from "@/domain/declarations/declarations";
import {
  generateAccountantExport,
  generateAnnualRevenueSummary,
  generateDeclarationSummaryDocument,
  generateMonthlyCashSummary,
  generateThresholdRadarReport,
} from "@/domain/documents/documents";
import { groupRevenueByActivity } from "@/domain/revenue/revenue";
import { getRulesForYear } from "@/domain/rules/default-rules";
import { evaluateMicroThresholdUsage, evaluateVatWarning } from "@/domain/thresholds/thresholds";
import { requireUser } from "@/lib/auth";
import { NotFoundError, ValidationError, toActionError } from "@/lib/errors";
import { enforceFeature } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import type { ActionState } from "@/actions/auth";

export async function generateDocumentAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  let redirectTo: string | null = null;
  try {
    const user = await requireUser();
    const type = String(formData.get("type") ?? "");
    await enforceFeature(user.id, type === "ACCOUNTANT_EXPORT" ? "accountantExport" : "documentExport");
    const profile = await prisma.businessProfile.findUnique({ where: { userId: user.id } });
    if (!profile) throw new NotFoundError("Impossible de calculer votre disponible : profil activité incomplet.");

    const rules = getRulesForYear(profile.contributionRulesYear);
    const now = new Date();
    const year = Number(formData.get("year") ?? now.getFullYear());
    const revenueEntries = await prisma.revenueEntry.findMany({
      where: {
        userId: user.id,
        collectionDate: { gte: new Date(year, 0, 1), lte: new Date(year, 11, 31, 23, 59, 59) },
      },
    });
    const revenueLike = revenueEntries.map((entry) => ({
      activityCategory: entry.activityCategory,
      collectionDate: entry.collectionDate,
      grossAmountCents: entry.grossAmountCents,
      status: entry.status,
    }));
    const revenueByActivity = groupRevenueByActivity(revenueLike);
    const totalRevenueCents = Object.values(revenueByActivity).reduce((sum, cents) => sum + cents, 0);
    const cashProfile = {
      taxWithholdingEnabled: profile.taxWithholdingEnabled,
      conservativeReserveBufferRate: Number(profile.conservativeReserveBufferRate),
    };

    let document: { title: string; contentHtml: string; contentText: string };
    let relatedDeclarationPeriodId: string | null = null;

    if (type === "MONTHLY_CASH_SUMMARY") {
      const monthEntries = revenueLike.filter(
        (entry) => entry.collectionDate >= startOfMonth(now) && entry.collectionDate <= endOfMonth(now)
      );
      const cash = calculatePeriodCashBreakdown(monthEntries, rules, cashProfile);
      const latestReserve = await prisma.cashReserveSnapshot.findFirst({
        where: { userId: user.id },
        orderBy: { snapshotDate: "desc" },
      });
      const health = calculateReserveHealth(cash.recommendedReserveCents, latestReserve?.manuallyReservedCents ?? 0);
      document = generateMonthlyCashSummary({
        profile,
        monthLabel: new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(now),
        generatedAt: now,
        collectedRevenueCents: cash.grossAmountCents,
        recommendedReserveCents: cash.recommendedReserveCents,
        estimatedAvailableCents: cash.estimatedAvailableCents,
        reserveHealthLabel: health.label,
      });
    } else if (type === "DECLARATION_SUMMARY") {
      const periodId = String(formData.get("declarationPeriodId") ?? "");
      const period = await prisma.declarationPeriod.findFirst({ where: { id: periodId, userId: user.id } });
      if (!period) throw new NotFoundError("Période de déclaration introuvable.");
      const snapshot = calculateDeclarationSnapshot(period, revenueLike, rules, {
        taxWithholdingEnabled: profile.taxWithholdingEnabled,
      });
      relatedDeclarationPeriodId = period.id;
      document = generateDeclarationSummaryDocument({
        profile,
        periodLabel: period.label,
        generatedAt: now,
        totalRevenueCents: snapshot.totalRevenueCents,
        estimatedTotalDueCents: snapshot.estimatedTotalDueCents,
        estimatedNetCents: snapshot.estimatedNetCents,
        lines: (snapshot.breakdownJson.breakdown as Array<{
          activityCategory: typeof revenueLike[number]["activityCategory"];
          revenueCents: number;
          socialCents: number;
          trainingCents: number;
          taxCents: number;
        }>),
        notes: period.notes,
      });
    } else if (type === "ANNUAL_REVENUE_SUMMARY") {
      document = generateAnnualRevenueSummary({ profile, year, generatedAt: now, totalRevenueCents, revenueByActivity });
    } else if (type === "THRESHOLD_RADAR_REPORT") {
      const micro = evaluateMicroThresholdUsage(revenueByActivity, profile, rules);
      const vat = evaluateVatWarning(revenueByActivity, profile, rules);
      document = generateThresholdRadarReport({
        profile,
        generatedAt: now,
        year,
        totalRevenueCents: micro.totalRevenueCents,
        thresholdCents: micro.thresholdCents,
        usagePercent: micro.usagePercent,
        riskLabel: micro.riskLevel,
        vatMessage: vat.message,
      });
    } else if (type === "ACCOUNTANT_EXPORT") {
      const documentCount = await prisma.generatedDocument.count({ where: { userId: user.id } });
      document = generateAccountantExport({ profile, generatedAt: now, year, totalRevenueCents, documentCount });
    } else {
      throw new ValidationError("Impossible de générer ce document : informations manquantes.");
    }

    const saved = await prisma.generatedDocument.create({
      data: {
        userId: user.id,
        type: type as never,
        title: document.title,
        contentHtml: document.contentHtml,
        contentText: document.contentText,
        relatedDeclarationPeriodId,
      },
    });
    revalidatePath("/app/documents");
    redirectTo = `/app/documents/${saved.id}`;
  } catch (error) {
    return toActionError(error);
  }

  redirect(redirectTo ?? "/app/documents");
}

export async function deleteDocumentAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  await prisma.generatedDocument.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/app/documents");
}

export async function generateDocumentDirectAction(formData: FormData): Promise<void> {
  await generateDocumentAction({}, formData);
}
