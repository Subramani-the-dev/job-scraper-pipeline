-- CreateEnum
CREATE TYPE "CompanyCategory" AS ENUM ('PRODUCT_SAAS_HOMEGROWN', 'GLOBAL_PRODUCT_GCC', 'BANK_FINTECH_GCC', 'SERVICES_CONSULTING');

-- CreateEnum
CREATE TYPE "SourceKind" AS ENUM ('WORKDAY', 'GREENHOUSE', 'LEVER', 'ASHBY', 'ORACLE_HCM', 'SUCCESSFACTORS', 'RIPPLEHIRE', 'SMARTRECRUITERS', 'EIGHTFOLD', 'ZOHO_RECRUIT', 'KULA', 'CUSTOM_JSON', 'CUSTOM_HTML', 'CUSTOM_PLAYWRIGHT');

-- CreateEnum
CREATE TYPE "RunStatus" AS ENUM ('OK', 'PARTIAL', 'FAILED');

-- CreateEnum
CREATE TYPE "TrackingStatus" AS ENUM ('UNSET', 'SAVED', 'APPLIED', 'IGNORED');

-- CreateEnum
CREATE TYPE "AlertPostingStatus" AS ENUM ('PENDING', 'SENDING', 'SENT');

-- CreateEnum
CREATE TYPE "AlertKind" AS ENUM ('DIGEST', 'ANOMALY', 'FAILURE_STREAK');

-- CreateEnum
CREATE TYPE "AlertLogStatus" AS ENUM ('SENT', 'FAILED');

-- CreateTable
CREATE TABLE "Company" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "category" "CompanyCategory" NOT NULL,
    "careersUrl" TEXT,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Source" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "kind" "SourceKind" NOT NULL,
    "label" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Run" (
    "id" SERIAL NOT NULL,
    "sourceId" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "status" "RunStatus" NOT NULL,
    "errorKind" TEXT,
    "postingsCount" INTEGER NOT NULL DEFAULT 0,
    "newCount" INTEGER NOT NULL DEFAULT 0,
    "warnings" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "Run_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Posting" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "sourceId" INTEGER NOT NULL,
    "identityKey" TEXT NOT NULL,
    "externalId" TEXT,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "locationText" TEXT NOT NULL,
    "postedAt" TIMESTAMP(3),
    "descriptionHtml" TEXT NOT NULL,
    "descriptionText" TEXT NOT NULL,
    "experienceMinYears" INTEGER,
    "experienceMaxYears" INTEGER,
    "sourceMeta" JSONB,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "trackingStatus" "TrackingStatus" NOT NULL DEFAULT 'UNSET',
    "trackingUpdatedAt" TIMESTAMP(3),

    CONSTRAINT "Posting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FilterConfig" (
    "id" SERIAL NOT NULL,
    "keywords" TEXT[],
    "cities" TEXT[],
    "minExperienceYears" INTEGER,
    "includeUnknownExperience" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FilterConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertLog" (
    "id" SERIAL NOT NULL,
    "kind" "AlertKind" NOT NULL,
    "sourceId" INTEGER NOT NULL,
    "runId" INTEGER NOT NULL,
    "status" "AlertLogStatus" NOT NULL,
    "telegramMessageId" TEXT,
    "postingCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlertLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertPosting" (
    "id" SERIAL NOT NULL,
    "postingId" INTEGER NOT NULL,
    "alertLogId" INTEGER,
    "status" "AlertPostingStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimedAt" TIMESTAMP(3),

    CONSTRAINT "AlertPosting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_name_key" ON "Company"("name");

-- CreateIndex
CREATE INDEX "Source_companyId_idx" ON "Source"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Source_companyId_label_key" ON "Source"("companyId", "label");

-- CreateIndex
CREATE INDEX "Run_sourceId_startedAt_idx" ON "Run"("sourceId", "startedAt" DESC);

-- CreateIndex
CREATE INDEX "Posting_closedAt_firstSeenAt_idx" ON "Posting"("closedAt", "firstSeenAt" DESC);

-- CreateIndex
CREATE INDEX "Posting_trackingStatus_idx" ON "Posting"("trackingStatus");

-- CreateIndex
CREATE INDEX "Posting_sourceId_idx" ON "Posting"("sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "Posting_companyId_identityKey_key" ON "Posting"("companyId", "identityKey");

-- CreateIndex
CREATE INDEX "FilterConfig_createdAt_idx" ON "FilterConfig"("createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "AlertPosting_postingId_key" ON "AlertPosting"("postingId");

-- AddForeignKey
ALTER TABLE "Source" ADD CONSTRAINT "Source_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Run" ADD CONSTRAINT "Run_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Posting" ADD CONSTRAINT "Posting_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Posting" ADD CONSTRAINT "Posting_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertLog" ADD CONSTRAINT "AlertLog_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertLog" ADD CONSTRAINT "AlertLog_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertPosting" ADD CONSTRAINT "AlertPosting_postingId_fkey" FOREIGN KEY ("postingId") REFERENCES "Posting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertPosting" ADD CONSTRAINT "AlertPosting_alertLogId_fkey" FOREIGN KEY ("alertLogId") REFERENCES "AlertLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;
