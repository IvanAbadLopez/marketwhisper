/**
 * Shared layer public API
 * Exports all reusable infrastructure components
 * @module shared
 */

// ===== LIB =====
export { cn } from "./lib/utils";

// ===== API =====
export { prisma } from "./api/prisma";
export { analyzeText } from "./api/ollama";
export type { AnalysisResult } from "./api/ollama";

// ===== CONFIG =====
export * from "./config/constants";
export { env } from "./config/env";

// ===== TYPES =====
// Re-export common types when created
