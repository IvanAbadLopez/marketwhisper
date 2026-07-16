/**
 * Shared layer public API
 * Exports all reusable infrastructure components
 * @module shared
 */

// ===== LIB =====
export { cn } from "./lib/utils";
export { parseAnalysisBullets, parseVerdict, type VerdictSummary } from "./lib/parseAnalysis";
export type { ParsedContent, ParsedBullet, ParsedParagraph, IconKey } from "./lib/parseAnalysis";
export { checkRateLimit, getClientIp, type RateLimitOptions, type RateLimitResult } from "./lib/rateLimit";
// Note: JobCancelledError and assertJobNotCancelled are server-only (import prisma)
// Import directly from "@/shared/lib/jobCancellation" in server-side code only

// ===== UI =====
export { AnalysisContent } from "./ui/AnalysisContent";

// ===== API =====
// Note: prisma is NOT exported here to avoid bundling server-only dependencies in client components
// Import directly from "@/shared/api/prisma" in server-side code (API routes, Server Components, etc.)
export { analyzeText, detectCompanies, analyzeWithFinancials } from "./api/ollama";
export type { AnalysisResult, CompanyDetection } from "./api/ollama";
export { 
  resolveTicker, 
  fetchFinnhubData, 
  fetchCompanyNews,
  formatFinancialsBlock,
  createFinancialSnapshot,
  // Note: getCachedFinnhub is server-only (uses prisma via dynamic import)
  // Import directly from "@/shared/api/finnhub" in server-side code only
  normalizeTicker,
  calcAnalystScore,
  analystScoreLabel,
} from "./api/finnhub";
export type { FinnhubData, FinancialSnapshot, NewsItem, AnalystRecommendation } from "./api/finnhub";

// ===== CONFIG =====
export * from "./config/constants";
// Note: env is server-only (validates DATABASE_URL and other server vars at import time)
// Import directly from "@/shared/config/env" in server-side code only
// export { env } from "./config/env";

// ===== TYPES =====
// Re-export common types when created
