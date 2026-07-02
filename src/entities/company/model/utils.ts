/**
 * Company entity utilities
 * @module entities/company
 */

import { MARKET_CAP_UNITS } from "@/shared";

/**
 * Format market cap to human-readable string (T, B, M)
 */
export function formatMarketCap(marketCap: number | null): string {
  if (!marketCap) return "N/A";
  
  if (marketCap >= MARKET_CAP_UNITS.TRILLION) {
    return `$${(marketCap / MARKET_CAP_UNITS.TRILLION).toFixed(2)}T`;
  }
  
  if (marketCap >= MARKET_CAP_UNITS.BILLION) {
    return `$${(marketCap / MARKET_CAP_UNITS.BILLION).toFixed(2)}B`;
  }
  
  if (marketCap >= MARKET_CAP_UNITS.MILLION) {
    return `$${(marketCap / MARKET_CAP_UNITS.MILLION).toFixed(2)}M`;
  }
  
  return `$${marketCap.toLocaleString()}`;
}

/**
 * Get sentiment color based on score (-1 to 1)
 */
export function getSentimentColor(score: number | null): string {
  if (score === null) return "bg-zinc-300 dark:bg-zinc-700";
  if (score > 0.3) return "bg-green-500 dark:bg-green-600";
  if (score < -0.3) return "bg-red-500 dark:bg-red-600";
  return "bg-zinc-400 dark:bg-zinc-600";
}

/**
 * Get reliability color based on score (1-10)
 */
export function getReliabilityColor(score: number | null): string {
  if (score === null) return "bg-zinc-300 dark:bg-zinc-700";
  if (score >= 8) return "bg-green-500 dark:bg-green-600";
  if (score >= 5) return "bg-yellow-500 dark:bg-yellow-600";
  return "bg-red-500 dark:bg-red-600";
}

/**
 * Get sentiment label
 */
export function getSentimentLabel(score: number | null): string {
  if (score === null) return "NEUTRAL";
  if (score > 0.3) return "BULLISH";
  if (score < -0.3) return "BEARISH";
  return "NEUTRAL";
}
