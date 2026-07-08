/*
  Warnings:

  - A unique constraint covering the columns `[jobId]` on the table `Analysis` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[jobId]` on the table `CompanyEnrichment` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('ANALYSIS', 'ENRICHMENT');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "Analysis" ADD COLUMN     "jobId" TEXT;

-- AlterTable
ALTER TABLE "CompanyEnrichment" ADD COLUMN     "jobId" TEXT;

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
CREATE UNIQUE INDEX "Analysis_jobId_key" ON "Analysis"("jobId");

-- CreateIndex
CREATE INDEX "Analysis_jobId_idx" ON "Analysis"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyEnrichment_jobId_key" ON "CompanyEnrichment"("jobId");

-- CreateIndex
CREATE INDEX "CompanyEnrichment_jobId_idx" ON "CompanyEnrichment"("jobId");

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
