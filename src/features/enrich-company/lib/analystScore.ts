/**
 * Analyst sentiment score utilities (shared client/server)
 * @module features/enrich-company/lib
 */

export interface AnalystRecommendation {
  period: string;
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
}

/**
 * Calculate analyst sentiment score from recommendation distribution
 * @returns Score from -1 (bearish) to +1 (bullish), or null if no data
 */
export function calcAnalystScore(r: AnalystRecommendation): number | null {
  const total = r.strongBuy + r.buy + r.hold + r.sell + r.strongSell;
  if (total === 0) return null;
  
  // Weighted: strongBuy=+2, buy=+1, hold=0, sell=-1, strongSell=-2
  const weighted = r.strongBuy * 2 + r.buy - r.sell - r.strongSell * 2;
  
  // Normalize to [-1, 1] range
  return weighted / (total * 2);
}

/**
 * Get sentiment label from analyst score
 */
export function analystScoreLabel(score: number | null): string {
  if (score === null) return "N/A";
  if (score >= 0.6) return "Strong Bullish";
  if (score >= 0.2) return "Bullish";
  if (score >= -0.2) return "Neutral";
  if (score > -0.6) return "Bearish";
  return "Strong Bearish";
}
