export interface AnalystRecommendation {
  period: string;
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
}

export function calcAnalystScore(r: AnalystRecommendation): number | null {
  const total = r.strongBuy + r.buy + r.hold + r.sell + r.strongSell;
  if (total === 0) return null;
  
  const weighted = r.strongBuy * 2 + r.buy - r.sell - r.strongSell * 2;
  
  return weighted / (total * 2);
}

export function analystScoreLabel(score: number | null): string {
  if (score === null) return "N/A";
  if (score >= 0.6) return "Strong Bullish";
  if (score >= 0.2) return "Bullish";
  if (score >= -0.2) return "Neutral";
  if (score > -0.6) return "Bearish";
  return "Strong Bearish";
}
