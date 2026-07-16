/*
  Warnings:

  - You are about to drop the column `ollamaModel` on the `CompanyEnrichment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CompanyEnrichment" DROP COLUMN "ollamaModel",
ADD COLUMN     "aiModel" TEXT;
