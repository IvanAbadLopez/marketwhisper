-- Remove translation columns (no longer persisting translations)
-- AI analysis translations now handled on-demand in UI state only

-- Drop reasoningEs from Analysis table
ALTER TABLE "Analysis" DROP COLUMN IF EXISTS "reasoningEs";

-- Drop aiAnalysisEs from CompanyEnrichment table
ALTER TABLE "CompanyEnrichment" DROP COLUMN IF EXISTS "aiAnalysisEs";
