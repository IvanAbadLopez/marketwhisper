-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('ANALYSIS', 'ENRICHMENT');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "Sentiment" AS ENUM ('BULLISH', 'BEARISH', 'NEUTRAL');

-- CreateEnum
CREATE TYPE "EnrichmentSource" AS ENUM ('FINNHUB');

-- CreateEnum
CREATE TYPE "EnrichmentStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "JobType" NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "ticker" TEXT NOT NULL,
    "result" JSONB,
    "errorMessage" TEXT,
    "analysisId" TEXT,
    "enrichmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sector" TEXT,
    "industry" TEXT,
    "marketCap" DOUBLE PRECISION,
    "logoUrl" TEXT,
    "website" TEXT,
    "avgSentimentScore" DOUBLE PRECISION,
    "avgReliabilityScore" DOUBLE PRECISION,
    "analysisCount" INTEGER NOT NULL DEFAULT 0,
    "globalScore" DOUBLE PRECISION,
    "globalScoreLabel" TEXT,
    "targetPrice" DOUBLE PRECISION,
    "valuationBreakdown" JSONB,
    "valuationUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Analysis" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "source" TEXT,
    "companyId" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "sentiment" "Sentiment" NOT NULL,
    "reliabilityScore" INTEGER NOT NULL,
    "reasoning" TEXT NOT NULL,
    "financialSnapshot" JSONB,
    "jobId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyEnrichment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "source" "EnrichmentSource" NOT NULL DEFAULT 'FINNHUB',
    "status" "EnrichmentStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "financialData" JSONB,
    "priceData" JSONB,
    "newsHeadlines" JSONB,
    "recommendations" JSONB,
    "aiAnalysis" TEXT,
    "aiModel" TEXT,
    "jobId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyEnrichment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Job_analysisId_key" ON "Job"("analysisId");

-- CreateIndex
CREATE UNIQUE INDEX "Job_enrichmentId_key" ON "Job"("enrichmentId");

-- CreateIndex
CREATE INDEX "Job_userId_idx" ON "Job"("userId");

-- CreateIndex
CREATE INDEX "Job_status_idx" ON "Job"("status");

-- CreateIndex
CREATE INDEX "Job_type_idx" ON "Job"("type");

-- CreateIndex
CREATE INDEX "Job_createdAt_idx" ON "Job"("createdAt");

-- CreateIndex
CREATE INDEX "Company_userId_idx" ON "Company"("userId");

-- CreateIndex
CREATE INDEX "Company_ticker_idx" ON "Company"("ticker");

-- CreateIndex
CREATE INDEX "Company_sector_idx" ON "Company"("sector");

-- CreateIndex
CREATE UNIQUE INDEX "Company_userId_ticker_key" ON "Company"("userId", "ticker");

-- CreateIndex
CREATE INDEX "Analysis_userId_idx" ON "Analysis"("userId");

-- CreateIndex
CREATE INDEX "Analysis_companyId_idx" ON "Analysis"("companyId");

-- CreateIndex
CREATE INDEX "Analysis_ticker_idx" ON "Analysis"("ticker");

-- CreateIndex
CREATE INDEX "Analysis_createdAt_idx" ON "Analysis"("createdAt");

-- CreateIndex
CREATE INDEX "Analysis_jobId_idx" ON "Analysis"("jobId");

-- CreateIndex
CREATE INDEX "CompanyEnrichment_userId_idx" ON "CompanyEnrichment"("userId");

-- CreateIndex
CREATE INDEX "CompanyEnrichment_companyId_idx" ON "CompanyEnrichment"("companyId");

-- CreateIndex
CREATE INDEX "CompanyEnrichment_ticker_idx" ON "CompanyEnrichment"("ticker");

-- CreateIndex
CREATE INDEX "CompanyEnrichment_source_idx" ON "CompanyEnrichment"("source");

-- CreateIndex
CREATE INDEX "CompanyEnrichment_createdAt_idx" ON "CompanyEnrichment"("createdAt");

-- CreateIndex
CREATE INDEX "CompanyEnrichment_status_idx" ON "CompanyEnrichment"("status");

-- CreateIndex
CREATE INDEX "CompanyEnrichment_jobId_idx" ON "CompanyEnrichment"("jobId");

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Analysis" ADD CONSTRAINT "Analysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Analysis" ADD CONSTRAINT "Analysis_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyEnrichment" ADD CONSTRAINT "CompanyEnrichment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyEnrichment" ADD CONSTRAINT "CompanyEnrichment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
