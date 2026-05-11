CREATE TABLE "Prospect" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "siret" TEXT,
    "activity" TEXT,
    "city" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "status" TEXT NOT NULL DEFAULT 'new',
    "outboundStep" INTEGER NOT NULL DEFAULT 0,
    "lastEmailAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Prospect_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Prospect_email_key" ON "Prospect"("email");
CREATE INDEX "Prospect_status_outboundStep_idx" ON "Prospect"("status", "outboundStep");
CREATE INDEX "Prospect_createdAt_idx" ON "Prospect"("createdAt");
