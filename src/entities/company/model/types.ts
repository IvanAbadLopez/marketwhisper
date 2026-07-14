/**
 * Company entity types
 * @module entities/company
 */

export interface AnalysisSummary {
  id: string;
  sentiment: string;
  reliabilityScore: number;
  createdAt: string;
}

export interface Company {
  id: string;
  ticker: string;
  name: string;
  description: string | null;
  sector: string | null;
  industry: string | null;
  marketCap: number | null;
  website: string | null;
  logoUrl: string | null;
  avgSentimentScore: number | null;
  avgReliabilityScore: number | null;
  analysisCount: number;
  _count?: {
    analyses: number;
  };
  analyses?: AnalysisSummary[];
}

export interface CompanyWithDetails extends Company {
  analyses: AnalysisSummary[];
}
