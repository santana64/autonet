import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/domain/auth/passwords";
import { calculateEntryCashBreakdown, calculatePeriodCashBreakdown } from "../src/domain/cashflow/cashflow";
import { calculateDeclarationSnapshot, generateDeclarationPeriods } from "../src/domain/declarations/declarations";
import {
  generateAccountantExport,
  generateAnnualRevenueSummary,
  generateDeclarationSummaryDocument,
  generateMonthlyCashSummary,
  generateThresholdRadarReport,
} from "../src/domain/documents/documents";
import { groupRevenueByActivity } from "../src/domain/revenue/revenue";
import { getRulesForYear } from "../src/domain/rules/default-rules";
import { evaluateMicroThresholdUsage, evaluateVatWarning } from "../src/domain/thresholds/thresholds";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@autonet.fr";
  const password = "Autonet-demo-2026!";
  await prisma.user.deleteMany({ where: { email } });

  const user = await prisma.user.create({
    data: {
      email,
      name: "Démo AutoNet",
      passwordHash: await hashPassword(password),
      emailVerifiedAt: new Date(),
    },
  });

  const profile = await prisma.businessProfile.create({
    data: {
      userId: user.id,
      businessName: "Studio Cashflow Demo",
      ownerName: "Camille Martin",
      siret: "12345678900015",
      siren: "123456789",
      address: "12 rue des Indépendants",
      postalCode: "75010",
      city: "Paris",
      email,
      phone: "0600000000",
      mainActivityCategory: "SERVICE_BNC",
      activityCategories: ["SERVICE_BNC", "SERVICE_BIC"],
      mixedActivityEnabled: true,
      declarationFrequency: "MONTHLY",
      vatStatus: "FRANCHISE_BASE",
      taxWithholdingEnabled: true,
      contributionRulesYear: 2026,
      conservativeReserveBufferRate: 0.05,
      documentFooterText: "Document généré pour suivi interne AutoNet.",
      defaultSignature: "Camille Martin",
    },
  });

  await prisma.subscription.create({
    data: {
      userId: user.id,
      plan: "PRO",
      status: "active_mock",
      currentPeriodEnd: new Date(2026, 11, 31),
    },
  });

  const clients = await Promise.all(
    [
      "Atelier Nova",
      "Bluebird Conseil",
      "Maison Voltaire",
      "Studio Pixel",
      "Coachline",
      "DataForge",
      "Le Marché Local",
      "Orion Formation",
    ].map((name, index) =>
      prisma.client.create({
        data: {
          userId: user.id,
          name,
          companyName: index % 2 === 0 ? name : null,
          email: `client${index + 1}@example.com`,
          notes: "Client de démonstration.",
        },
      })
    )
  );

  const createdPeriods = await Promise.all(
    generateDeclarationPeriods(2026, "MONTHLY").map((period) =>
      prisma.declarationPeriod.create({
        data: {
          ...period,
          userId: user.id,
          status: period.periodIndex < 4 ? "PAID" : period.periodIndex === 4 ? "DECLARED" : "OPEN",
          declaredAt: period.periodIndex < 5 ? new Date(2026, period.periodIndex, 2) : null,
          paidAt: period.periodIndex < 4 ? new Date(2026, period.periodIndex, 5) : null,
        },
      })
    )
  );

  const rules = getRulesForYear(2026);
  const cashProfile = {
    taxWithholdingEnabled: profile.taxWithholdingEnabled,
    conservativeReserveBufferRate: Number(profile.conservativeReserveBufferRate),
  };

  const entries = [];
  for (let month = 0; month < 12; month += 1) {
    const client = clients[month % clients.length];
    const period = createdPeriods[month];
    const activityCategory = month % 4 === 0 ? "SERVICE_BIC" : "SERVICE_BNC";
    const grossAmountCents = (2600 + month * 180) * 100;
    const cash = calculateEntryCashBreakdown(
      { activityCategory, grossAmountCents, status: "COLLECTED" },
      rules,
      cashProfile
    );

    entries.push(
      await prisma.revenueEntry.create({
        data: {
          userId: user.id,
          clientId: client.id,
          clientName: client.name,
          description: month % 3 === 0 ? "Mission conseil produit" : "Prestation développement",
          activityCategory,
          invoiceDate: new Date(2026, month, 5),
          collectionDate: new Date(2026, month, 18),
          grossAmountCents,
          paymentMethod: "Virement",
          declarationPeriodId: period.id,
          status: "COLLECTED",
          estimatedContributionCents:
            cash.socialContributionEstimateCents + cash.trainingContributionEstimateCents,
          estimatedTaxWithholdingCents: cash.taxWithholdingEstimateCents,
          estimatedReserveCents: cash.recommendedReserveCents,
          estimatedAvailableCents: cash.estimatedAvailableCents,
          notes: "Encaissement de démonstration.",
        },
      })
    );

    if (month % 4 === 1) {
      entries.push(
        await prisma.revenueEntry.create({
          data: {
            userId: user.id,
            clientName: "Prospect en attente",
            description: "Facture non réglée",
            activityCategory: "SERVICE_BNC",
            invoiceDate: new Date(2026, month, 24),
            collectionDate: new Date(2026, month, 28),
            grossAmountCents: 900_00,
            status: "PENDING_INVOICE",
          },
        })
      );
    }
  }

  const revenueLike = entries.map((entry) => ({
    activityCategory: entry.activityCategory,
    collectionDate: entry.collectionDate,
    grossAmountCents: entry.grossAmountCents,
    status: entry.status,
  }));

  for (const period of createdPeriods) {
    await prisma.declarationSnapshot.create({
      data: {
        declarationPeriodId: period.id,
        ...calculateDeclarationSnapshot(period, revenueLike, rules, {
          taxWithholdingEnabled: profile.taxWithholdingEnabled,
        }),
      },
    });
  }

  const currentEntries = revenueLike.filter((entry) => entry.collectionDate.getMonth() === 4);
  const currentCash = calculatePeriodCashBreakdown(currentEntries, rules, cashProfile);
  const manuallyReservedCents = Math.round(currentCash.recommendedReserveCents * 0.72);
  const missingReserveCents = Math.max(0, currentCash.recommendedReserveCents - manuallyReservedCents);

  await prisma.reserveEvent.createMany({
    data: [
      {
        userId: user.id,
        type: "SET_ASIDE",
        amountCents: 500_00,
        eventDate: new Date(2026, 4, 19),
        note: "Mise de côté après encaissement client.",
      },
      {
        userId: user.id,
        type: "ADJUSTMENT",
        amountCents: manuallyReservedCents,
        eventDate: new Date(2026, 4, 28),
        note: "Ajustement de réserve de démonstration.",
      },
    ],
  });

  await prisma.cashReserveSnapshot.create({
    data: {
      userId: user.id,
      snapshotDate: new Date(2026, 4, 28),
      bankBalanceCents: currentCash.grossAmountCents + 1_200_00,
      manuallyReservedCents,
      targetReserveCents: currentCash.recommendedReserveCents,
      missingReserveCents,
      safeAvailableCents: Math.max(0, currentCash.grossAmountCents + 1_200_00 - missingReserveCents),
      notes: "Snapshot initial pour piloter la réserve.",
    },
  });

  await prisma.reminder.createMany({
    data: [
      {
        userId: user.id,
        type: "DECLARATION_DUE",
        title: "Préparer la déclaration du mois",
        description: "Vérifier les encaissements et marquer la période prête.",
        dueDate: new Date(2026, 4, 31),
        relatedDeclarationPeriodId: createdPeriods[4].id,
      },
      {
        userId: user.id,
        type: "RESERVE_MISSING",
        title: "Réserve à compléter",
        description: "Le montant mis de côté ne couvre pas encore la réserve recommandée.",
        dueDate: new Date(2026, 4, 29),
      },
      {
        userId: user.id,
        type: "THRESHOLD_WARNING",
        title: "Surveiller le seuil de franchise TVA",
        description: "La projection annuelle approche d'un seuil à vérifier.",
        dueDate: new Date(2026, 5, 15),
      },
    ],
  });

  const byActivity = groupRevenueByActivity(revenueLike);
  const totalRevenue = Object.values(byActivity).reduce((sum, cents) => sum + cents, 0);
  const micro = evaluateMicroThresholdUsage(byActivity, profile, rules);
  const vat = evaluateVatWarning(byActivity, profile, rules);
  const mayPeriod = createdPeriods[4];
  const maySnapshot = calculateDeclarationSnapshot(mayPeriod, revenueLike, rules, {
    taxWithholdingEnabled: profile.taxWithholdingEnabled,
  });

  const docs = [
    {
      type: "MONTHLY_CASH_SUMMARY" as const,
      doc: generateMonthlyCashSummary({
        profile,
        monthLabel: "mai 2026",
        generatedAt: new Date(2026, 4, 28),
        collectedRevenueCents: currentCash.grossAmountCents,
        recommendedReserveCents: currentCash.recommendedReserveCents,
        estimatedAvailableCents: currentCash.estimatedAvailableCents,
        reserveHealthLabel: missingReserveCents > 0 ? "Réserve à compléter" : "Réserve suffisante",
      }),
    },
    {
      type: "DECLARATION_SUMMARY" as const,
      relatedDeclarationPeriodId: mayPeriod.id,
      doc: generateDeclarationSummaryDocument({
        profile,
        periodLabel: mayPeriod.label,
        generatedAt: new Date(2026, 4, 28),
        totalRevenueCents: maySnapshot.totalRevenueCents,
        estimatedTotalDueCents: maySnapshot.estimatedTotalDueCents,
        estimatedNetCents: maySnapshot.estimatedNetCents,
        lines: (maySnapshot.breakdownJson.breakdown as Array<{
          activityCategory: keyof typeof byActivity;
          revenueCents: number;
          socialCents: number;
          trainingCents: number;
          taxCents: number;
        }>).map((line) => ({
          activityCategory: line.activityCategory,
          revenueCents: line.revenueCents,
          socialCents: line.socialCents,
          trainingCents: line.trainingCents,
          taxCents: line.taxCents,
        })),
      }),
    },
    {
      type: "ANNUAL_REVENUE_SUMMARY" as const,
      doc: generateAnnualRevenueSummary({
        profile,
        year: 2026,
        generatedAt: new Date(2026, 4, 28),
        totalRevenueCents: totalRevenue,
        revenueByActivity: byActivity,
      }),
    },
    {
      type: "THRESHOLD_RADAR_REPORT" as const,
      doc: generateThresholdRadarReport({
        profile,
        generatedAt: new Date(2026, 4, 28),
        year: 2026,
        totalRevenueCents: micro.totalRevenueCents,
        thresholdCents: micro.thresholdCents,
        usagePercent: micro.usagePercent,
        riskLabel: micro.riskLevel,
        vatMessage: vat.message,
      }),
    },
    {
      type: "ACCOUNTANT_EXPORT" as const,
      doc: generateAccountantExport({
        profile,
        generatedAt: new Date(2026, 4, 28),
        year: 2026,
        totalRevenueCents: totalRevenue,
        documentCount: 4,
      }),
    },
  ];

  await prisma.generatedDocument.createMany({
    data: docs.map(({ type, doc, relatedDeclarationPeriodId }) => ({
      userId: user.id,
      type,
      title: doc.title,
      contentHtml: doc.contentHtml,
      contentText: doc.contentText,
      relatedDeclarationPeriodId,
    })),
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
