/**
 * Shared layer public API
 * Exports all reusable infrastructure components
 * @module shared
 */

// ===== LIB =====
export { cn } from "./lib/utils";
export { parseAnalysisBullets } from "./lib/parseAnalysis";
export type { ParsedContent, ParsedBullet, ParsedParagraph, IconKey } from "./lib/parseAnalysis";

// ===== UI =====
export { AnalysisContent } from "./ui/AnalysisContent";

// ===== API =====
export { prisma } from "./api/prisma";
export { analyzeText, detectCompanies, analyzeWithFinancials } from "./api/ollama";
export type { AnalysisResult, CompanyDetection } from "./api/ollama";
export { 
  resolveTicker, 
  fetchFinnhubData, 
  formatFinancialsBlock,
  createFinancialSnapshot,
  getCachedFinnhub,
  normalizeTicker,
  calcAnalystScore,
  analystScoreLabel,
} from "./api/finnhub";
export type { FinnhubData, FinancialSnapshot, AnalystRecommendation } from "./api/finnhub";

// ===== CONFIG =====
export * from "./config/constants";
export { env } from "./config/env";

// ===== TYPES =====
// Re-export common types when created
