export interface FinancialSnapshot {
  currentPrice: number | null;
  peRatio: number | null;
  eps: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  analystConsensus: string | null;
  fetchedAt: string;
}

export interface Analysis {
  id: string;
  text: string;
  source: string | null;
  sentiment: "BULLISH" | "BEARISH" | "NEUTRAL";
  reliabilityScore: number;
  reasoning: string;
  financialSnapshot?: FinancialSnapshot | null;
  createdAt: string;
  companyId: string;
  company: {
    ticker: string;
    name: string;
  };
}

export interface AnalysisFormData {
  text: string;
  source?: string;
}
