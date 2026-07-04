/**
 * Company Enrichment Types
 * @module features/enrich-company/model
 */

export type EnrichmentSource = "YAHOO" | "FINNHUB";

export interface CompanyInfo {
  ticker: string;
  name: string | null;
  sector: string | null;
  industry: string | null;
  description: string | null;
  website: string | null;
  employees: number | null;
  marketCap: number | null;
}

export interface FinancialMetrics {
  revenue: number | null;
  netIncome: number | null;
  eps: number | null;
  peRatio: number | null;
  debtToEquity: number | null;
  dividendYield: number | null;
  profitMargins: number | null;
}

export interface PriceData {
  currentPrice: number | null;
  previousClose: number | null;
  dayChange: number | null;
  dayChangePercent: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  volume: number | null;
  avgVolume: number | null;
}

export interface NewsItem {
  title: string;
  publisher: string | null;
  link: string | null;
  publishedAt: string | null;
}

export interface Recommendation {
  period: string;
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
}

export interface EnrichmentResult {
  success: boolean;
  ticker: string;
  enrichmentId: string;
  companyInfo?: CompanyInfo;
  financials?: FinancialMetrics;
  price?: PriceData;
  newsCount: number;
  recommendationsCount: number;
  aiAnalysis: string;
  timestamp: string;
}

export type EnrichmentStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

/** Response of POST /enrich - background job accepted */
export interface EnrichmentJobStarted {
  success: boolean;
  ticker: string;
  enrichmentId: string;
  status: EnrichmentStatus;
  source: EnrichmentSource;
}

/** Response of GET /enrich/[id] - current status of a background job */
export interface EnrichmentStatusResult {
  enrichmentId: string;
  ticker: string;
  source: EnrichmentSource;
  status: EnrichmentStatus;
  errorMessage: string | null;
  aiAnalysis: string | null;
  financials: FinancialMetrics | null;
  price: PriceData | null;
  news: NewsItem[] | null;
  recommendations: Recommendation[] | null;
  ollamaModel: string | null;
  updatedAt: string;
}

export interface EnrichmentError {
  error: string;
}
