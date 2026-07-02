/**
 * Shared layer public API
 * Exports all reusable infrastructure components
 * @module shared
 */

// ===== LIB =====
export { cn } from "./lib/utils";

// ===== API =====
export { prisma } from "./api/prisma";
export { analyzeText } from "./api/gemini";
export type { AnalysisResult } from "./api/gemini";

// ===== CONFIG =====
export * from "./config/constants";
export { env } from "./config/env";

// ===== TYPES =====
// Re-export common types when created
