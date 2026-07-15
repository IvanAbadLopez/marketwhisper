/**
 * Finnhub API Client Helper
 * Provides ticker resolution, financial data fetching, and caching utilities
 */

import { env } from '@/shared/config/env';

interface FinnhubSearchResult {
  symbol: string;
  description: string;
  displaySymbol: string;
  type: string;
}

interface FinnhubSearchResponse {
  success: boolean;
  query: string;
  count: number;
  results: FinnhubSearchResult[];
  timestamp: string;
}

export interface AnalystRecommendation {
  buy: number;
  hold: number;
  sell: number;
  strongBuy: number;
  strongSell: number;
  period: string;
}

export interface FinnhubData {
  success: boolean;
  ticker: string;
  companyInfo?: {
    ticker: string;
    name: string | null;
    sector: string | null;
    industry: string | null;
    description: string | null;
    website: string | null;
    employees: number | null;
    marketCap: number | null;
  };
  financials?: {
    revenue: number | null;
    netIncome: number | null;
    eps: number | null;
    peRatio: number | null;
    debtToEquity: number | null;
    dividendYield: number | null;
    profitMargins: number | null;
    bookValuePerShare: number | null;  // For Graham Number valuation
    roe: number | null;  // Return on Equity
    epsGrowth: number | null;  // EPS growth rate
  };
  price?: {
    currentPrice: number | null;
    previousClose: number | null;
    dayChange: number | null;
    dayChangePercent: number | null;
    fiftyTwoWeekHigh: number | null;
    fiftyTwoWeekLow: number | null;
    volume: number | null;
    avgVolume: number | null;
  };
  recommendations?: AnalystRecommendation[];
}

export interface FinancialSnapshot {
  currentPrice: number | null;
  peRatio: number | null;
  eps: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  analystConsensus: string | null; // e.g., "Strong Buy", "Hold"
  fetchedAt: string; // ISO timestamp
}

export interface NewsItem {
  title: string;
  summary: string | null;
  publisher: string | null;
  link: string | null;
  publishedAt: string | null; // ISO timestamp
  image: string | null;
}

/**
 * Resolve a company name to its ticker using Finnhub symbol lookup
 * Prefers Common Stock listings and avoids exotic symbols
 * 
 * @param companyName - The company name to resolve
 * @returns The resolved ticker symbol (uppercase) or empty string if not found
 */
export async function resolveTicker(companyName: string): Promise<string> {
  if (!companyName || !companyName.trim()) {
    return '';
  }

  const enrichmentUrl = env.ENRICHMENT_SERVICE_URL;
  
  try {
    const response = await fetch(
      `${enrichmentUrl}/api/search-finnhub?q=${encodeURIComponent(companyName)}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (!response.ok) {
      console.warn(`[resolveTicker] Finnhub search failed for "${companyName}": ${response.statusText}`);
      return '';
    }

    const data: FinnhubSearchResponse = await response.json();

    if (!data.success || data.count === 0) {
      console.log(`[resolveTicker] No results found for "${companyName}"`);
      return '';
    }

    // Prioritize results:
    // 1. Symbol without exotic suffixes (prefer US exchanges or ADRs ending in Y)
    // 2. Common Stock type over other types
    // 3. Shortest symbol (usually the primary listing)
    
    // Filter for US-tradeable symbols first (most important for investors)
    const usSymbols = data.results.filter(r => {
      const symbol = r.symbol || r.displaySymbol;
      // Prefer symbols without dots (US exchanges) or ADRs ending in Y
      return !symbol.includes('.') || symbol.endsWith('Y');
    });

    // Pick candidates: prefer US symbols, fallback to all if none
    const candidates = usSymbols.length > 0 ? usSymbols : data.results;

    if (candidates.length === 0) {
      console.log(`[resolveTicker] No suitable candidates for "${companyName}"`);
      return '';
    }

    // Sort by: Common Stock first, then by symbol length (shortest first)
    const bestMatch = candidates.sort((a, b) => {
      const aIsCommonStock = a.type === 'Common Stock' ? 0 : 1;
      const bIsCommonStock = b.type === 'Common Stock' ? 0 : 1;
      
      if (aIsCommonStock !== bIsCommonStock) {
        return aIsCommonStock - bIsCommonStock;
      }
      
      const aSymbol = a.symbol || a.displaySymbol;
      const bSymbol = b.symbol || b.displaySymbol;
      return aSymbol.length - bSymbol.length;
    })[0];

    const ticker = (bestMatch.symbol || bestMatch.displaySymbol).toUpperCase();
    console.log(`[resolveTicker] Resolved "${companyName}" → ${ticker}`);
    
    return ticker;
  } catch (error) {
    console.error(`[resolveTicker] Error resolving ticker for "${companyName}":`, error);
    return '';
  }
}

/**
 * Normalize ticker by removing special characters like $
 */
export function normalizeTicker(ticker: string): string {
  return ticker.replace(/^\$/, '').trim().toUpperCase();
}

/**
 * Fetch financial data from enrichment service (Python FastAPI + Finnhub)
 */
export async function fetchFinnhubData(ticker: string): Promise<FinnhubData> {
  const enrichmentUrl = env.ENRICHMENT_SERVICE_URL;
  const normalizedTicker = normalizeTicker(ticker);
  
  try {
    const response = await fetch(`${enrichmentUrl}/api/enrich-finnhub/${normalizedTicker}`);
    
    if (!response.ok) {
      let errorDetail = response.statusText;
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorDetail = errorData.detail;
        }
      } catch {
        // If can't parse JSON, use statusText
      }

      if (response.status === 404) {
        throw new Error(`Ticker ${ticker} not found in Finnhub. Please verify the ticker symbol.`);
      }
      if (response.status === 429) {
        throw new Error(`Finnhub rate limit exceeded. Please wait a few minutes before trying again.`);
      }
      if (response.status === 503) {
        throw new Error(`Finnhub service unavailable. FINNHUB_API_KEY may not be configured.`);
      }
      throw new Error(`Enrichment service error: ${errorDetail}`);
    }

    const data: FinnhubData = await response.json();
    return data;
  } catch (error: unknown) {
    console.error("Failed to fetch Finnhub data:", error);
    throw error;
  }
}

/**
 * Calculate analyst consensus score from recommendations
 * Returns a number from -1 (Strong Sell) to +1 (Strong Buy)
 */
export function calcAnalystScore(rec: AnalystRecommendation): number | null {
  const total = rec.strongBuy + rec.buy + rec.hold + rec.sell + rec.strongSell;
  if (total === 0) return null;
  
  const score = (
    (rec.strongBuy * 1) +
    (rec.buy * 0.5) +
    (rec.hold * 0) +
    (rec.sell * -0.5) +
    (rec.strongSell * -1)
  ) / total;
  
  return score;
}

/**
 * Get analyst consensus label from score
 */
export function analystScoreLabel(score: number | null): string {
  if (score === null) return "N/A";
  if (score >= 0.6) return "Strong Buy";
  if (score >= 0.2) return "Buy";
  if (score >= -0.2) return "Hold";
  if (score >= -0.6) return "Sell";
  return "Strong Sell";
}

/**
 * Format financial data block for LLM prompts
 * Shared between processEnrichment and analyzeWithFinancials
 */
export function formatFinancialsBlock(ticker: string, data: FinnhubData): string {
  const { companyInfo, financials, price, recommendations } = data;
  
  let block = `**${ticker}** (${companyInfo?.name || "Unknown"}):\n`;
  block += `- Sector: ${companyInfo?.sector || "N/A"} | Market Cap: ${companyInfo?.marketCap ? `$${(companyInfo.marketCap / 1e9).toFixed(2)}B` : "N/A"}\n`;
  block += `- EPS: ${financials?.eps?.toFixed(2) || "N/A"} | P/E: ${financials?.peRatio?.toFixed(2) || "N/A"} | Margin: ${financials?.profitMargins ? `${(financials.profitMargins * 100).toFixed(1)}%` : "N/A"}\n`;
  block += `- Price: $${price?.currentPrice?.toFixed(2) || "N/A"} | 52W High: $${price?.fiftyTwoWeekHigh?.toFixed(2) || "N/A"} | Low: $${price?.fiftyTwoWeekLow?.toFixed(2) || "N/A"}`;
  
  if (recommendations && recommendations.length > 0) {
    const latest = recommendations[recommendations.length - 1];
    const score = calcAnalystScore(latest);
    const label = analystScoreLabel(score);
    block += `\n- Analyst Consensus: ${label} (Score: ${score !== null ? score.toFixed(2) : "N/A"})`;
  }
  
  return block;
}

/**
 * Create a compact financial snapshot from Finnhub data
 */
export function createFinancialSnapshot(data: FinnhubData): FinancialSnapshot {
  const { financials, price, recommendations } = data;
  
  let analystConsensus = null;
  if (recommendations && recommendations.length > 0) {
    const latest = recommendations[recommendations.length - 1];
    const score = calcAnalystScore(latest);
    analystConsensus = analystScoreLabel(score);
  }
  
  return {
    currentPrice: price?.currentPrice || null,
    peRatio: financials?.peRatio || null,
    eps: financials?.eps || null,
    fiftyTwoWeekHigh: price?.fiftyTwoWeekHigh || null,
    fiftyTwoWeekLow: price?.fiftyTwoWeekLow || null,
    analystConsensus,
    fetchedAt: new Date().toISOString(),
  };
}

// Note: getCachedFinnhub has been moved to finnhub-server.ts (server-only, uses prisma)

/**
 * Fetch recent news for a company from Finnhub
 * 
 * @param ticker - Stock ticker symbol (e.g., AAPL, MSFT)
 * @param days - Number of days to look back (default: 7)
 * @returns Array of news items with title, summary, source, url, publishedAt
 */
export async function fetchCompanyNews(
  ticker: string,
  days: number = 7
): Promise<NewsItem[]> {
  if (!ticker || !ticker.trim()) {
    console.error('[fetchCompanyNews] Invalid ticker provided');
    return [];
  }

  const normalizedTicker = ticker.trim().toUpperCase();
  const enrichmentUrl = env.ENRICHMENT_SERVICE_URL;

  try {
    const response = await fetch(
      `${enrichmentUrl}/api/news-finnhub/${normalizedTicker}?days=${days}`
    );

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Finnhub rate limit exceeded. Please try again later.');
      }
      if (response.status === 503) {
        throw new Error('Finnhub service unavailable. Please check configuration.');
      }
      if (response.status === 404) {
        console.warn(`[fetchCompanyNews] No news found for ticker: ${normalizedTicker}`);
        return [];
      }
      throw new Error(`Failed to fetch news: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success || !Array.isArray(data.news)) {
      console.error('[fetchCompanyNews] Invalid response format:', data);
      return [];
    }

    console.log(`[fetchCompanyNews] Fetched ${data.news.length} articles for ${normalizedTicker} (${days} days)`);

    return data.news;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[fetchCompanyNews] Error fetching news for ${normalizedTicker}:`, message);
    throw error;
  }
}
