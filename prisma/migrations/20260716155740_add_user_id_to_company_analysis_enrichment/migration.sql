/*
  Warnings:

  - A unique constraint covering the columns `[userId,ticker]` on the table `Company` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `Analysis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `CompanyEnrichment` table without a default value. This is not possible if the table is not empty.

*/

-- Step 1: Delete all existing data (clean slate for multi-tenant migration)
-- Delete in order to respect foreign key constraints
DELETE FROM "Job" WHERE "type" = 'ANALYSIS' OR "type" = 'ENRICHMENT';
DELETE FROM "CompanyEnrichment";
DELETE FROM "Analysis";
DELETE FROM "Company";

-- Step 2: Drop unique constraint on ticker (will be replaced with composite unique on userId+ticker)
-- DropIndex
DROP INDEX "Company_ticker_key";

-- Step 3: Add userId columns
-- AlterTable
ALTER TABLE "Analysis" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "CompanyEnrichment" ADD COLUMN     "userId" TEXT NOT NULL;

-- Step 4: Create indexes
-- CreateIndex
CREATE INDEX "Analysis_userId_idx" ON "Analysis"("userId");

-- CreateIndex
CREATE INDEX "Company_userId_idx" ON "Company"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Company_userId_ticker_key" ON "Company"("userId", "ticker");

-- CreateIndex
CREATE INDEX "CompanyEnrichment_userId_idx" ON "CompanyEnrichment"("userId");

-- Step 5: Add foreign key constraints
-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Analysis" ADD CONSTRAINT "Analysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyEnrichment" ADD CONSTRAINT "CompanyEnrichment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
