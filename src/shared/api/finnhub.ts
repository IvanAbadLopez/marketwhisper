/**
 * Finnhub API Client Helper
 * Calls Finnhub REST API directly (no Python microservice required)
 */

import { env } from '@/shared/config/env';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

/**
 * Generic fetch helper for Finnhub API with auth header
 */
async function fetchFinnhub<T>(endpoint: string): Promise<T> {
  if (!env.FINNHUB_API_KEY) {
    throw new Error('FINNHUB_API_KEY not configured. Please set it in your .env file.');
  }

  const url = `${FINNHUB_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'X-Finnhub-Token': env.FINNHUB_API_KEY,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 429) {
      throw new Error('Finnhub rate limit exceeded. Please try again later.');
    }
    if (response.status === 401) {
      throw new Error('Finnhub API authentication failed. Check your FINNHUB_API_KEY.');
    }
    throw new Error(`Finnhub API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

/**
 * Search for companies using Finnhub symbol lookup
 * Returns raw Finnhub search results
 * 
 * @param query - Search query (company name or ticker)
 * @returns Array of search results with symbol, description, type
 */
export async function searchFinnhubSymbols(query: string): Promise<FinnhubSearchResult[]> {
  if (!query || !query.trim()) {
    return [];
  }

  try {
    const data = await fetchFinnhub<FinnhubSearchResponse>(`/search?q=${encodeURIComponent(query.trim())}`);
    return data.result || [];
  } catch (error) {
    console.error(`[searchFinnhubSymbols] Error searching for "${query}":`, error);
    throw error;
  }
}

interface FinnhubSearchResult {
  symbol: string;
  description: string;
  displaySymbol: string;
  type: string;
}

interface FinnhubSearchResponse {
  count: number;
  result: FinnhubSearchResult[];
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

  try {
    const query = companyName.trim();
    console.log(`[resolveTicker] Searching Finnhub for: "${query}"`);
    
    const data = await fetchFinnhub<FinnhubSearchResponse>(`/search?q=${encodeURIComponent(query)}`);

    if (!data || !data.result || data.result.length === 0) {
      console.log(`[resolveTicker] No results found for "${query}"`);
      return '';
    }

    // Filter for US-tradeable symbols first (most important for investors)
    const usSymbols = data.result.filter(r => {
      const symbol = r.symbol || r.displaySymbol;
      // Prefer symbols without dots (US exchanges) or ADRs ending in Y
      return !symbol.includes('.') || symbol.endsWith('Y');
    });

    // Pick candidates: prefer US symbols, fallback to all if none
    const candidates = usSymbols.length > 0 ? usSymbols : data.result;

    if (candidates.length === 0) {
      console.log(`[resolveTicker] No suitable candidates for "${query}"`);
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
    console.log(`[resolveTicker] Resolved "${query}" → ${ticker}`);
    
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
 * Fetch financial data from Finnhub API directly
 * Combines company profile, financial metrics, and analyst recommendations
 */
export async function fetchFinnhubData(ticker: string): Promise<FinnhubData> {
  const normalizedTicker = normalizeTicker(ticker);
  
  try {
    console.log(`[fetchFinnhubData] Fetching data for ${normalizedTicker}`);

    // 1. Fetch company profile
    interface ProfileResponse {
      ticker?: string;
      name?: string;
      finnhubIndustry?: string;
      weburl?: string;
      marketCapitalization?: number;
    }
    
    const profile = await fetchFinnhub<ProfileResponse>(`/stock/profile2?symbol=${normalizedTicker}`);
    
    if (!profile || !profile.name) {
      throw new Error(`Ticker ${normalizedTicker} not found in Finnhub. Please verify the ticker symbol.`);
    }

    // 2. Fetch financial metrics
    interface MetricsResponse {
      metric?: Record<string, number>;
    }
    
    let metricData: Record<string, number> = {};
    try {
      const metrics = await fetchFinnhub<MetricsResponse>(`/stock/metric?symbol=${normalizedTicker}&metric=all`);
      metricData = metrics.metric || {};
    } catch (error) {
      console.warn(`[fetchFinnhubData] Metrics fetch failed for ${normalizedTicker}:`, error);
    }

    // 3. Fetch analyst recommendations
    interface RecommendationResponse {
      period: string;
      strongBuy: number;
      buy: number;
      hold: number;
      sell: number;
      strongSell: number;
    }
    
    let recommendations: AnalystRecommendation[] = [];
    try {
      const recTrends = await fetchFinnhub<RecommendationResponse[]>(`/stock/recommendation?symbol=${normalizedTicker}`);
      recommendations = (recTrends || []).map(r => ({
        period: r.period || '',
        strongBuy: r.strongBuy || 0,
        buy: r.buy || 0,
        hold: r.hold || 0,
        sell: r.sell || 0,
        strongSell: r.strongSell || 0,
      }));
    } catch (error) {
      console.warn(`[fetchFinnhubData] Recommendations fetch failed for ${normalizedTicker}:`, error);
    }

    // Build response matching FinnhubData interface
    return {
      success: true,
      ticker: normalizedTicker,
      companyInfo: {
        ticker: normalizedTicker,
        name: profile.name || null,
        sector: profile.finnhubIndustry || null,
        industry: profile.finnhubIndustry || null,
        description: null, // Not available in profile2
        website: profile.weburl || null,
        employees: null, // Not available in profile2
        marketCap: profile.marketCapitalization 
          ? Math.round(profile.marketCapitalization * 1e6) 
          : null,
      },
      financials: {
        revenue: null, // Not directly available in basic metrics
        netIncome: null, // Not directly available in basic metrics
        eps: metricData['epsBasic'] || null,
        peRatio: metricData['peBasicExclExtraTTM'] || null,
        debtToEquity: metricData['totalDebt/totalEquityQuarterly'] || null,
        dividendYield: metricData['dividendYieldIndicatedAnnual'] || null,
        profitMargins: metricData['netProfitMarginTTM'] || null,
        bookValuePerShare: metricData['bookValuePerShareAnnual'] || null,
        roe: metricData['roeTTM'] || null,
        epsGrowth: metricData['epsGrowthTTMYoy'] || null,
      },
      price: {
        currentPrice: null, // Would need quote endpoint (not fetched)
        previousClose: null,
        dayChange: null,
        dayChangePercent: null,
        fiftyTwoWeekHigh: metricData['52WeekHigh'] || null,
        fiftyTwoWeekLow: metricData['52WeekLow'] || null,
        volume: null,
        avgVolume: null,
      },
      recommendations,
    };
  } catch (error: unknown) {
    console.error(`[fetchFinnhubData] Failed to fetch data for ${normalizedTicker}:`, error);
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
 * Fetch recent news for a company from Finnhub API directly
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

  if (days < 1 || days > 365) {
    throw new Error('Days parameter must be between 1 and 365.');
  }

  const normalizedTicker = ticker.trim().toUpperCase();

  try {
    console.log(`[fetchCompanyNews] Fetching news for ${normalizedTicker} (${days} days)`);

    // Calculate date range (Finnhub expects YYYY-MM-DD format)
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(toDate.getDate() - days);

    const toStr = toDate.toISOString().split('T')[0];
    const fromStr = fromDate.toISOString().split('T')[0];

    interface FinnhubNewsItem {
      headline: string;
      summary: string;
      source: string;
      url: string;
      datetime: number; // Unix timestamp
      image: string;
    }

    const newsData = await fetchFinnhub<FinnhubNewsItem[]>(
      `/company-news?symbol=${normalizedTicker}&from=${fromStr}&to=${toStr}`
    );

    if (!Array.isArray(newsData)) {
      console.error('[fetchCompanyNews] Invalid response format:', newsData);
      return [];
    }

    const news: NewsItem[] = newsData.map(item => ({
      title: item.headline || '',
      summary: item.summary || null,
      publisher: item.source || null,
      link: item.url || null,
      publishedAt: item.datetime ? new Date(item.datetime * 1000).toISOString() : null,
      image: item.image || null,
    }));

    console.log(`[fetchCompanyNews] Fetched ${news.length} articles for ${normalizedTicker}`);

    return news;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[fetchCompanyNews] Error fetching news for ${normalizedTicker}:`, message);
    throw error;
  }
}
