/**
 * Analysis entity types
 * @module entities/analysis
 */

export interface Analysis {
  id: string;
  text: string;
  source: string | null;
  sentiment: "BULLISH" | "BEARISH" | "NEUTRAL";
  reliabilityScore: number; // 1-10
  reasoning: string;
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
