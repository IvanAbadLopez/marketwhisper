/*
  Warnings:

  - You are about to drop the `Content` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ContentCompany` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Mention` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Transcript` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ContentCompany" DROP CONSTRAINT "ContentCompany_companyId_fkey";

-- DropForeignKey
ALTER TABLE "ContentCompany" DROP CONSTRAINT "ContentCompany_contentId_fkey";

-- DropForeignKey
ALTER TABLE "Mention" DROP CONSTRAINT "Mention_companyId_fkey";

-- DropForeignKey
ALTER TABLE "Mention" DROP CONSTRAINT "Mention_contentId_fkey";

-- DropForeignKey
ALTER TABLE "Transcript" DROP CONSTRAINT "Transcript_contentId_fkey";

-- AlterTable
ALTER TABLE "Analysis" ADD COLUMN     "financialSnapshot" JSONB;

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "globalScore" DOUBLE PRECISION,
ADD COLUMN     "globalScoreLabel" TEXT,
ADD COLUMN     "targetPrice" DOUBLE PRECISION,
ADD COLUMN     "valuationBreakdown" JSONB,
ADD COLUMN     "valuationUpdatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "CompanyEnrichment" ADD COLUMN     "financialData" JSONB,
ADD COLUMN     "newsHeadlines" JSONB,
ADD COLUMN     "priceData" JSONB,
ADD COLUMN     "recommendations" JSONB;

-- DropTable
DROP TABLE "Content";

-- DropTable
DROP TABLE "ContentCompany";

-- DropTable
DROP TABLE "Mention";

-- DropTable
DROP TABLE "Transcript";

-- DropEnum
DROP TYPE "ContentStatus";

-- DropEnum
DROP TYPE "ContentType";
