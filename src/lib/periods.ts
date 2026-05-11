import { DeclarationFrequency } from "@/domain/activity";
import { calculateDeclarationSnapshot, generateDeclarationPeriods } from "@/domain/declarations/declarations";
import { assignRevenueToDeclarationPeriod } from "@/domain/revenue/revenue";
import { getRulesForYear } from "@/domain/rules/default-rules";
import { NotFoundError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

export async function getOrCreateDeclarationPeriod(userId: string, date: Date, frequency: DeclarationFrequency) {
  const draft = assignRevenueToDeclarationPeriod({ collectionDate: date }, frequency);
  return prisma.declarationPeriod.upsert({
    where: {
      userId_year_periodType_periodIndex: {
        userId,
        year: draft.year,
        periodType: draft.periodType,
        periodIndex: draft.periodIndex,
      },
    },
    create: { ...draft, userId, status: "OPEN" },
    update: {
      label: draft.label,
      startDate: draft.startDate,
      endDate: draft.endDate,
      dueDate: draft.dueDate,
    },
  });
}

export async function ensureDeclarationPeriods(userId: string, year: number, frequency: DeclarationFrequency) {
  const drafts = generateDeclarationPeriods(year, frequency);
  for (const draft of drafts) {
    await prisma.declarationPeriod.upsert({
      where: {
        userId_year_periodType_periodIndex: {
          userId,
          year: draft.year,
          periodType: draft.periodType,
          periodIndex: draft.periodIndex,
        },
      },
      create: { ...draft, userId, status: "OPEN" },
      update: {
        label: draft.label,
        startDate: draft.startDate,
        endDate: draft.endDate,
        dueDate: draft.dueDate,
      },
    });
  }
}

export async function refreshDeclarationSnapshot(userId: string, declarationPeriodId: string) {
  const period = await prisma.declarationPeriod.findFirst({ where: { id: declarationPeriodId, userId } });
  if (!period) throw new NotFoundError("Période de déclaration introuvable.");

  const profile = await prisma.businessProfile.findUnique({ where: { userId } });
  if (!profile) throw new NotFoundError("Profil activité incomplet.");

  const entries = await prisma.revenueEntry.findMany({
    where: {
      userId,
      collectionDate: { gte: period.startDate, lte: period.endDate },
    },
  });
  const snapshot = calculateDeclarationSnapshot(
    period,
    entries.map((entry) => ({
      activityCategory: entry.activityCategory,
      collectionDate: entry.collectionDate,
      grossAmountCents: entry.grossAmountCents,
      status: entry.status,
    })),
    getRulesForYear(profile.contributionRulesYear),
    { taxWithholdingEnabled: profile.taxWithholdingEnabled }
  );
  return prisma.declarationSnapshot.create({
    data: {
      declarationPeriodId: period.id,
      ...snapshot,
    },
  });
}
