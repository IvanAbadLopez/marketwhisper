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
  jobId: string;
  status: string;
  message: string;
  error?: string;
}
