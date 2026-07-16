import { MARKET_CAP_UNITS } from "@/shared/config/constants";

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

export function getSentimentColor(score: number | null): string {
  if (score === null) return "bg-zinc-300 dark:bg-zinc-700";
  if (score > 0.3) return "bg-green-500 dark:bg-green-600";
  if (score < -0.3) return "bg-red-500 dark:bg-red-600";
  return "bg-zinc-400 dark:bg-zinc-600";
}

export function getReliabilityColor(score: number | null): string {
  if (score === null) return "bg-zinc-300 dark:bg-zinc-700";
  if (score >= 8) return "bg-green-500 dark:bg-green-600";
  if (score >= 5) return "bg-yellow-500 dark:bg-yellow-600";
  return "bg-red-500 dark:bg-red-600";
}

export function getSentimentLabel(score: number | null): string {
  if (score === null) return "NEUTRAL";
  if (score > 0.3) return "BULLISH";
  if (score < -0.3) return "BEARISH";
  return "NEUTRAL";
}

export function getGlobalScoreColor(score: number | null): string {
  if (score === null) return "bg-zinc-300 dark:bg-zinc-700";
  if (score >= 75) return "bg-green-500 dark:bg-green-600";
  if (score >= 60) return "bg-blue-500 dark:bg-blue-600";
  if (score >= 40) return "bg-amber-500 dark:bg-amber-600";
  return "bg-red-500 dark:bg-red-600";
}

export function getGlobalScoreLabelColor(label: string | null): string {
  if (!label) return "text-zinc-600 dark:text-zinc-400";
  if (label === "Strong") return "text-green-600 dark:text-green-400";
  if (label === "Moderate") return "text-amber-600 dark:text-amber-400";
  if (label === "Neutral") return "text-blue-600 dark:text-blue-400";
  if (label === "Weak") return "text-red-600 dark:text-red-400";
  return "text-zinc-600 dark:text-zinc-400";
}
