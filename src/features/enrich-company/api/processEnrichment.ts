/**
 * Shared server utilities for company enrichment with Finnhub + Ollama
 * @module features/enrich-company/api/processEnrichment
 */

import { env } from "@/shared/config/env";
import { calcAnalystScore, analystScoreLabel, type AnalystRecommendation } from "../lib/analystScore";

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
  recommendations?: AnalystRecommendation[];
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

  let prompt = `You are a financial analyst AI. Analyze ${ticker} (${companyInfo?.name || "Unknown"}) using Finnhub data and user analyses.

**Data:**
- Sector: ${companyInfo?.sector || "N/A"} | Market Cap: ${companyInfo?.marketCap ? `$${(companyInfo.marketCap / 1e9).toFixed(2)}B` : "N/A"}
- EPS: ${financials?.eps?.toFixed(2) || "N/A"} | P/E: ${financials?.peRatio?.toFixed(2) || "N/A"} | Margin: ${financials?.profitMargins ? `${(financials.profitMargins * 100).toFixed(1)}%` : "N/A"}
- 52W High: $${price?.fiftyTwoWeekHigh?.toFixed(2) || "N/A"} | Low: $${price?.fiftyTwoWeekLow?.toFixed(2) || "N/A"}`;

  // Add analyst recommendations if available
  if (data.recommendations && data.recommendations.length > 0) {
    const latest = data.recommendations[data.recommendations.length - 1];
    const score = calcAnalystScore(latest);
    const label = analystScoreLabel(score);
    prompt += `\n- Analyst Consensus: ${label} (Score: ${score !== null ? score.toFixed(2) : "N/A"})`;
  }

  // Add user text analyses if available (limit to 5, shorter excerpts)
  if (userAnalyses.length > 0) {
    prompt += `\n\n**User Analyses (${userAnalyses.length} total):**`;
    userAnalyses.slice(0, 5).forEach((analysis, idx) => {
      prompt += `\n${idx + 1}. ${analysis.sentiment} (${analysis.reliabilityScore}/10): "${analysis.text.substring(0, 120)}${analysis.text.length > 120 ? '...' : ''}" - ${analysis.reasoning}`;
    });
    
    if (userAnalyses.length > 5) {
      prompt += `\n... (${userAnalyses.length - 5} more)`;
    }
  }

  prompt += `\n\n**Task:**
Provide a concise investment recommendation starting with:
VERDICT: [BULLISH/BEARISH/NEUTRAL] | Risk: [Low/Medium/High] | Confidence: [1-10]/10

Then 3-5 bullet points with:
• Key strengths/weaknesses
• Financial health assessment
• Market sentiment synthesis
• Investment outlook

Be concise, data-driven, and actionable.`;

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
async function generateOllamaAnalysis(prompt: string): Promise<string> {
  const ollamaUrl = env.OLLAMA_URL;
  const model = env.OLLAMA_MODEL;
  
  try {
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        keep_alive: '30m', // Keep model in memory for 30 minutes (avoids cold-start)
        options: {
          temperature: 0.7,
          top_p: 0.9,
          num_predict: 400, // Reduced for concise output
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

    // 5. Store final result and mark as completed (translation deferred to on-demand)
    await prisma.companyEnrichment.update({
      where: { id: enrichmentId },
      data: {
        status: "COMPLETED",
        recommendations: (finnhubData.recommendations ?? undefined) as any,
        aiAnalysis,
        // aiAnalysisEs remains null - will be translated on-demand via UI button
        ollamaModel: env.OLLAMA_MODEL,
        errorMessage: null,
      },
    });

    // 6. Update job status if exists
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
