export interface ContentSummary {
  id: string;
  title: string | null;
  contentType: string;
  date: string;
  status: string;
}

export interface ContentCompany {
  id: string;
  content: ContentSummary;
}

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
  globalScore: number | null;
  globalScoreLabel: string | null;
  _count?: {
    content: number;
    mentions: number;
    analyses: number;
  };
  content?: ContentCompany[];
  analyses?: AnalysisSummary[];
}

export interface CompanyWithDetails extends Company {
  content: ContentCompany[];
  analyses: AnalysisSummary[];
}
