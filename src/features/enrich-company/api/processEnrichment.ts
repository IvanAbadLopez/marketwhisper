/**
 * Shared server utilities for company enrichment with Finnhub + Ollama
 * @module features/enrich-company/api/processEnrichment
 */

import { env } from "@/shared/config/env";
import { translateToSpanish } from "@/shared/api/translate";

interface UserAnalysis {
  text: string;
  source: string | null;
  sentiment: string;
  reliabilityScore: number;
  reasoning: string;
  createdAt: Date;
}

interface FinnhubData {
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
}

interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}

/**
 * Generate AI analysis prompt from Finnhub data + user text analyses
 */
function generateAnalysisPrompt(
  ticker: string, 
  data: FinnhubData, 
  userAnalyses: UserAnalysis[]
): string {
  const { companyInfo, financials, price } = data;

  let prompt = `You are a financial analyst AI. Analyze the following data for ${ticker} (${companyInfo?.name || "Unknown Company"}) sourced from Finnhub and user-submitted text analyses, then provide a comprehensive investment analysis.

**Company Overview:**
- Sector: ${companyInfo?.sector || "N/A"}
- Industry: ${companyInfo?.industry || "N/A"}
- Market Cap: ${companyInfo?.marketCap ? `$${(companyInfo.marketCap / 1e9).toFixed(2)}B` : "N/A"}
- Website: ${companyInfo?.website || "N/A"}

**Financial Metrics:**
- EPS: ${financials?.eps?.toFixed(2) || "N/A"}
- P/E Ratio: ${financials?.peRatio?.toFixed(2) || "N/A"}
- Dividend Yield: ${financials?.dividendYield ? `${(financials.dividendYield * 100).toFixed(2)}%` : "N/A"}
- Profit Margin: ${financials?.profitMargins ? `${(financials.profitMargins * 100).toFixed(2)}%` : "N/A"}

**52-Week Performance:**
- 52-Week High: $${price?.fiftyTwoWeekHigh?.toFixed(2) || "N/A"}
- 52-Week Low: $${price?.fiftyTwoWeekLow?.toFixed(2) || "N/A"}`;

  // Add user text analyses if available
  if (userAnalyses.length > 0) {
    prompt += `\n\n**User Text Analyses (${userAnalyses.length} total):**\n`;
    userAnalyses.slice(0, 10).forEach((analysis, idx) => {
      const source = analysis.source ? ` from ${analysis.source}` : '';
      prompt += `\n${idx + 1}. **${analysis.sentiment}** (Reliability: ${analysis.reliabilityScore}/10)${source}
   Text: "${analysis.text.substring(0, 200)}${analysis.text.length > 200 ? '...' : ''}"
   AI Reasoning: ${analysis.reasoning}\n`;
    });
    
    if (userAnalyses.length > 10) {
      prompt += `\n... and ${userAnalyses.length - 10} more analyses.\n`;
    }
  }

  prompt += `\n**Your Task:**
Provide a structured analysis with the following sections:
1. **Executive Summary** (2-3 sentences combining Finnhub metrics and user sentiment)
2. **Financial Health** (assess profitability, valuation from Finnhub data)
3. **Market Sentiment** (synthesize insights from user text analyses)
4. **Investment Outlook** (bullish, bearish, or neutral with reasoning based on ALL available data)

Keep your analysis concise, objective, and data-driven. Integrate both quantitative metrics (Finnhub) and qualitative insights (user texts) to provide actionable investment guidance.`;

  return prompt;
}

/**
 * Normalize ticker by removing special characters like $
 */
export function normalizeTicker(ticker: string): string {
  return ticker.replace(/^\$/, '').trim().toUpperCase();
}

/**
 * Call Ollama API to generate AI analysis
 */
async function generateOllamaAnalysis(prompt: string, model: string = "llama3.1:8b"): Promise<string> {
  const ollamaUrl = env.OLLAMA_URL;
  
  try {
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          num_predict: 1000,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data: OllamaResponse = await response.json();
    return data.response;
  } catch (error) {
    console.error("Ollama API call failed:", error);
    throw new Error("Failed to generate AI analysis. Ensure Ollama service is running.");
  }
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
 * Process Finnhub enrichment in the background
 * Used by both the enrich endpoint and the import endpoint
 */
export async function processEnrichment(
  enrichmentId: string,
  companyId: string,
  ticker: string,
  jobId?: string // Optional job ID for queue tracking
): Promise<void> {
  const { prisma } = await import("@/shared/api/prisma");

  try {
    // Mark enrichment and job as processing
    await prisma.companyEnrichment.update({
      where: { id: enrichmentId },
      data: { status: "PROCESSING" },
    });

    if (jobId) {
      await prisma.job.update({
        where: { id: jobId },
        data: { status: "PROCESSING" },
      });
    }

    // 1. Fetch financial data from Finnhub (via enrichment service)
    console.log(`[Enrich-Finnhub:${enrichmentId}] Fetching Finnhub data for ${ticker}...`);
    const finnhubData = await fetchFinnhubData(ticker);

    if (!finnhubData.success) {
      throw new Error("Failed to fetch financial data from Finnhub");
    }

    // 2. Update company metadata from Finnhub if available
    if (finnhubData.companyInfo) {
      const { name, sector, industry, website, marketCap } = finnhubData.companyInfo;
      const company = await prisma.company.findUnique({ where: { id: companyId } });
      if (company) {
        await prisma.company.update({
          where: { id: companyId },
          data: {
            name: name || company.name,
            sector: sector || company.sector,
            industry: industry || company.industry,
            website: website || company.website,
            marketCap: marketCap || company.marketCap,
          },
        });
      }
    }

    // 3. Fetch user text analyses for this company
    console.log(`[Enrich-Finnhub:${enrichmentId}] Fetching user text analyses for ${ticker}...`);
    const userAnalyses = await prisma.analysis.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 20, // Limit to most recent 20 analyses
      select: {
        text: true,
        source: true,
        sentiment: true,
        reliabilityScore: true,
        reasoning: true,
        createdAt: true,
      },
    });

    // 4. Generate AI analysis with Ollama (combining Finnhub data + user texts)
    console.log(`[Enrich-Finnhub:${enrichmentId}] Generating Ollama analysis for ${ticker} (${userAnalyses.length} user analyses)...`);
    const prompt = generateAnalysisPrompt(ticker, finnhubData, userAnalyses);
    const aiAnalysis = await generateOllamaAnalysis(prompt);

    // 5. Translate AI analysis to Spanish
    console.log(`[Enrich-Finnhub:${enrichmentId}] Translating analysis to Spanish...`);
    const aiAnalysisEs = await translateToSpanish(aiAnalysis);

    // 6. Store final result and mark as completed
    await prisma.companyEnrichment.update({
      where: { id: enrichmentId },
      data: {
        status: "COMPLETED",
        aiAnalysis,
        aiAnalysisEs,
        ollamaModel: "llama3.1:8b",
        errorMessage: null,
      },
    });

    // 7. Update job status if exists
    if (jobId) {
      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: "COMPLETED",
          result: {
            enrichmentId,
            aiAnalysisPreview: aiAnalysis.substring(0, 200) + "...",
          } as any,
        },
      });
    }

    console.log(`[Enrich-Finnhub:${enrichmentId}] Successfully enriched ${ticker}`);
  } catch (error: unknown) {
    console.error(`[Enrich-Finnhub:${enrichmentId}] Failed to enrich ${ticker}:`, error);
    const errorMessage = error instanceof Error ? error.message : "Failed to enrich company with Finnhub";
    
    try {
      await prisma.companyEnrichment.update({
        where: { id: enrichmentId },
        data: {
          status: "FAILED",
          errorMessage,
        },
      });

      // Update job status if exists
      if (jobId) {
        await prisma.job.update({
          where: { id: jobId },
          data: {
            status: "FAILED",
            errorMessage,
          },
        });
      }
    } catch (updateError) {
      console.error(`[Enrich-Finnhub:${enrichmentId}] Could not mark as FAILED:`, updateError);
    }
  }
}
