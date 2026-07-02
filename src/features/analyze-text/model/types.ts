// Feature: Analyze Text - Type Definitions

export interface AnalysisFormData {
  text: string;
  source?: string;
}

export interface AnalysisItem {
  id: string;
  ticker: string;
  sentiment: "BULLISH" | "BEARISH" | "NEUTRAL";
  reliabilityScore: number;
  reasoning: string;
  company: {
    ticker: string;
    name: string;
  };
}

export interface AnalysisResponse {
  success: boolean;
  count: number;
  analyses: AnalysisItem[];
  companies: Array<{
    ticker: string;
    name: string;
    avgSentimentScore?: number;
    avgReliabilityScore?: number;
    analysisCount: number;
  }>;
  message: string;
  error?: string;
}
