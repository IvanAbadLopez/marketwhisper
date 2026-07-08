/*
  Warnings:

  - You are about to drop the column `financialData` on the `CompanyEnrichment` table. All the data in the column will be lost.
  - You are about to drop the column `newsHeadlines` on the `CompanyEnrichment` table. All the data in the column will be lost.
  - You are about to drop the column `priceData` on the `CompanyEnrichment` table. All the data in the column will be lost.
  - You are about to drop the column `recommendations` on the `CompanyEnrichment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CompanyEnrichment" DROP COLUMN "financialData",
DROP COLUMN "newsHeadlines",
DROP COLUMN "priceData",
DROP COLUMN "recommendations";
