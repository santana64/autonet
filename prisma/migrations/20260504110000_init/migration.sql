-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ActivityCategory" AS ENUM ('GOODS_SALES', 'SERVICE_BIC', 'SERVICE_BNC', 'LIBERAL_CIPAV', 'LIBERAL_GENERAL', 'CRAFT_SERVICE', 'MIXED', 'ACCOMMODATION_CLASSIFIED', 'ACCOMMODATION_UNCLASSIFIED', 'OTHER');

-- CreateEnum
CREATE TYPE "DeclarationFrequency" AS ENUM ('MONTHLY', 'QUARTERLY');

-- CreateEnum
CREATE TYPE "VatStatus" AS ENUM ('FRANCHISE_BASE', 'VAT_LIABLE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "RevenueStatus" AS ENUM ('COLLECTED', 'PENDING_INVOICE', 'EXCLUDED');

-- CreateEnum
CREATE TYPE "PeriodType" AS ENUM ('MONTH', 'QUARTER');

-- CreateEnum
CREATE TYPE "DeclarationStatus" AS ENUM ('OPEN', 'READY', 'DECLARED', 'PAID', 'LATE');

-- CreateEnum
CREATE TYPE "ReminderType" AS ENUM ('DECLARATION_DUE', 'RESERVE_MISSING', 'THRESHOLD_WARNING', 'VAT_WARNING', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ReminderStatus" AS ENUM ('PENDING', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "GeneratedDocumentType" AS ENUM ('MONTHLY_CASH_SUMMARY', 'DECLARATION_SUMMARY', 'ANNUAL_REVENUE_SUMMARY', 'THRESHOLD_RADAR_REPORT', 'ACCOUNTANT_EXPORT');

-- CreateEnum
CREATE TYPE "ReserveEventType" AS ENUM ('SET_ASIDE', 'RELEASED', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'STARTER', 'PRO', 'CABINET');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "emailVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailVerificationToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessName" TEXT,
    "ownerName" TEXT,
    "siret" TEXT,
    "siren" TEXT,
    "address" TEXT,
    "postalCode" TEXT,
    "city" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "mainActivityCategory" "ActivityCategory" NOT NULL DEFAULT 'SERVICE_BNC',
    "activityCategories" "ActivityCategory"[] DEFAULT ARRAY['SERVICE_BNC']::"ActivityCategory"[],
    "mixedActivityEnabled" BOOLEAN NOT NULL DEFAULT false,
    "declarationFrequency" "DeclarationFrequency" NOT NULL DEFAULT 'MONTHLY',
    "vatStatus" "VatStatus" NOT NULL DEFAULT 'UNKNOWN',
    "taxWithholdingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "contributionRulesYear" INTEGER NOT NULL DEFAULT 2026,
    "conservativeReserveBufferRate" DECIMAL(5,4) NOT NULL DEFAULT 0.05,
    "reminderEmailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "documentFooterText" TEXT,
    "defaultSignature" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyName" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientId" TEXT,
    "clientName" TEXT,
    "description" TEXT,
    "activityCategory" "ActivityCategory" NOT NULL,
    "invoiceDate" TIMESTAMP(3),
    "collectionDate" TIMESTAMP(3) NOT NULL,
    "grossAmountCents" INTEGER NOT NULL,
    "paymentMethod" TEXT,
    "status" "RevenueStatus" NOT NULL DEFAULT 'COLLECTED',
    "estimatedContributionCents" INTEGER NOT NULL DEFAULT 0,
    "estimatedTaxWithholdingCents" INTEGER NOT NULL DEFAULT 0,
    "estimatedReserveCents" INTEGER NOT NULL DEFAULT 0,
    "estimatedAvailableCents" INTEGER NOT NULL DEFAULT 0,
    "declarationPeriodId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RevenueEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashReserveSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL,
    "bankBalanceCents" INTEGER,
    "manuallyReservedCents" INTEGER NOT NULL,
    "targetReserveCents" INTEGER NOT NULL,
    "missingReserveCents" INTEGER NOT NULL,
    "safeAvailableCents" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CashReserveSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReserveEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ReserveEventType" NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReserveEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeclarationPeriod" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "periodType" "PeriodType" NOT NULL,
    "periodIndex" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "status" "DeclarationStatus" NOT NULL DEFAULT 'OPEN',
    "declaredAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeclarationPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeclarationSnapshot" (
    "id" TEXT NOT NULL,
    "declarationPeriodId" TEXT NOT NULL,
    "totalRevenueCents" INTEGER NOT NULL,
    "estimatedSocialContributionsCents" INTEGER NOT NULL,
    "estimatedTrainingContributionCents" INTEGER NOT NULL,
    "estimatedTaxWithholdingCents" INTEGER NOT NULL,
    "estimatedTotalDueCents" INTEGER NOT NULL,
    "estimatedNetCents" INTEGER NOT NULL,
    "breakdownJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeclarationSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reminder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ReminderType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "ReminderStatus" NOT NULL DEFAULT 'PENDING',
    "relatedDeclarationPeriodId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedDocument" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "GeneratedDocumentType" NOT NULL,
    "title" TEXT NOT NULL,
    "contentHtml" TEXT NOT NULL,
    "contentText" TEXT NOT NULL,
    "relatedDeclarationPeriodId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneratedDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE',
    "status" TEXT NOT NULL DEFAULT 'free',
    "currentPeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimitEvent" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateLimitEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerificationToken_tokenHash_key" ON "EmailVerificationToken"("tokenHash");

-- CreateIndex
CREATE INDEX "EmailVerificationToken_userId_idx" ON "EmailVerificationToken"("userId");

-- CreateIndex
CREATE INDEX "EmailVerificationToken_expiresAt_idx" ON "EmailVerificationToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessProfile_userId_key" ON "BusinessProfile"("userId");

-- CreateIndex
CREATE INDEX "Client_userId_idx" ON "Client"("userId");

-- CreateIndex
CREATE INDEX "Client_userId_name_idx" ON "Client"("userId", "name");

-- CreateIndex
CREATE INDEX "RevenueEntry_userId_collectionDate_idx" ON "RevenueEntry"("userId", "collectionDate");

-- CreateIndex
CREATE INDEX "RevenueEntry_userId_activityCategory_idx" ON "RevenueEntry"("userId", "activityCategory");

-- CreateIndex
CREATE INDEX "RevenueEntry_userId_status_idx" ON "RevenueEntry"("userId", "status");

-- CreateIndex
CREATE INDEX "RevenueEntry_declarationPeriodId_idx" ON "RevenueEntry"("declarationPeriodId");

-- CreateIndex
CREATE INDEX "CashReserveSnapshot_userId_snapshotDate_idx" ON "CashReserveSnapshot"("userId", "snapshotDate");

-- CreateIndex
CREATE INDEX "CashReserveSnapshot_userId_createdAt_idx" ON "CashReserveSnapshot"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ReserveEvent_userId_eventDate_idx" ON "ReserveEvent"("userId", "eventDate");

-- CreateIndex
CREATE INDEX "DeclarationPeriod_userId_startDate_idx" ON "DeclarationPeriod"("userId", "startDate");

-- CreateIndex
CREATE INDEX "DeclarationPeriod_userId_status_idx" ON "DeclarationPeriod"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "DeclarationPeriod_userId_year_periodType_periodIndex_key" ON "DeclarationPeriod"("userId", "year", "periodType", "periodIndex");

-- CreateIndex
CREATE INDEX "DeclarationSnapshot_declarationPeriodId_createdAt_idx" ON "DeclarationSnapshot"("declarationPeriodId", "createdAt");

-- CreateIndex
CREATE INDEX "Reminder_userId_dueDate_idx" ON "Reminder"("userId", "dueDate");

-- CreateIndex
CREATE INDEX "Reminder_userId_status_idx" ON "Reminder"("userId", "status");

-- CreateIndex
CREATE INDEX "GeneratedDocument_userId_type_idx" ON "GeneratedDocument"("userId", "type");

-- CreateIndex
CREATE INDEX "GeneratedDocument_userId_createdAt_idx" ON "GeneratedDocument"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE INDEX "Subscription_stripeCustomerId_idx" ON "Subscription"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "Subscription_stripeSubscriptionId_idx" ON "Subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "RateLimitEvent_key_action_createdAt_idx" ON "RateLimitEvent"("key", "action", "createdAt");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailVerificationToken" ADD CONSTRAINT "EmailVerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessProfile" ADD CONSTRAINT "BusinessProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueEntry" ADD CONSTRAINT "RevenueEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueEntry" ADD CONSTRAINT "RevenueEntry_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueEntry" ADD CONSTRAINT "RevenueEntry_declarationPeriodId_fkey" FOREIGN KEY ("declarationPeriodId") REFERENCES "DeclarationPeriod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashReserveSnapshot" ADD CONSTRAINT "CashReserveSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReserveEvent" ADD CONSTRAINT "ReserveEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeclarationPeriod" ADD CONSTRAINT "DeclarationPeriod_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeclarationSnapshot" ADD CONSTRAINT "DeclarationSnapshot_declarationPeriodId_fkey" FOREIGN KEY ("declarationPeriodId") REFERENCES "DeclarationPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_relatedDeclarationPeriodId_fkey" FOREIGN KEY ("relatedDeclarationPeriodId") REFERENCES "DeclarationPeriod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedDocument" ADD CONSTRAINT "GeneratedDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedDocument" ADD CONSTRAINT "GeneratedDocument_relatedDeclarationPeriodId_fkey" FOREIGN KEY ("relatedDeclarationPeriodId") REFERENCES "DeclarationPeriod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

