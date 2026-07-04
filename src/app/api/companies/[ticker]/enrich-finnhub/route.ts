/**
 * Enrich Company with Finnhub API Endpoint
 * Fetches public financial data from Finnhub and generates AI analysis with Ollama
 */

import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { auth } from "@/lib/auth";
import { env } from "@/shared/config/env";

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
 * Generate AI analysis prompt from Finnhub data
 */
function generateAnalysisPrompt(ticker: string, data: FinnhubData): string {
  const { companyInfo, financials, price } = data;

  let prompt = `You are a financial analyst AI. Analyze the following data for ${ticker} (${companyInfo?.name || "Unknown Company"}) sourced from Finnhub and provide a comprehensive investment analysis.

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
- 52-Week Low: $${price?.fiftyTwoWeekLow?.toFixed(2) || "N/A"}

**Your Task:**
Provide a structured analysis with the following sections:
1. **Executive Summary** (2-3 sentences)
2. **Financial Health** (assess profitability, valuation)
3. **Market Position** (competitive advantages, sector trends)
4. **Investment Outlook** (bullish, bearish, or neutral with reasoning)

Keep your analysis concise, objective, and data-driven. Focus on actionable insights based on the available Finnhub metrics.`;

  return prompt;
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
async function fetchFinnhubData(ticker: string): Promise<FinnhubData> {
  const enrichmentUrl = env.ENRICHMENT_SERVICE_URL;
  
  try {
    const response = await fetch(`${enrichmentUrl}/api/enrich-finnhub/${ticker.toUpperCase()}`);
    
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
  } catch (error: any) {
    console.error("Failed to fetch Finnhub data:", error);
    throw error;
  }
}

/**
 * Process Finnhub enrichment in the background
 */
async function processEnrichment(
  enrichmentId: string,
  companyId: string,
  ticker: string
): Promise<void> {
  const { prisma } = await import("@/shared/api/prisma");

  try {
    // Mark as processing
    await prisma.companyEnrichment.update({
      where: { id: enrichmentId },
      data: { status: "PROCESSING" },
    });

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

    // 3. Generate AI analysis with Ollama
    console.log(`[Enrich-Finnhub:${enrichmentId}] Generating Ollama analysis for ${ticker}...`);
    const prompt = generateAnalysisPrompt(ticker, finnhubData);
    const aiAnalysis = await generateOllamaAnalysis(prompt);

    // 4. Store final result and mark as completed
    await prisma.companyEnrichment.update({
      where: { id: enrichmentId },
      data: {
        status: "COMPLETED",
        financialData: finnhubData.financials as any,
        priceData: finnhubData.price as any,
        aiAnalysis,
        ollamaModel: "llama3.1:8b",
        errorMessage: null,
      },
    });

    console.log(`[Enrich-Finnhub:${enrichmentId}] Successfully enriched ${ticker}`);
  } catch (error: any) {
    console.error(`[Enrich-Finnhub:${enrichmentId}] Failed to enrich ${ticker}:`, error);
    try {
      await prisma.companyEnrichment.update({
        where: { id: enrichmentId },
        data: {
          status: "FAILED",
          errorMessage: error?.message || "Failed to enrich company with Finnhub",
        },
      });
    } catch (updateError) {
      console.error(`[Enrich-Finnhub:${enrichmentId}] Could not mark as FAILED:`, updateError);
    }
  }
}

/**
 * POST /api/companies/[ticker]/enrich-finnhub
 * Kicks off a background Finnhub enrichment job
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { prisma } = await import("@/shared/api/prisma");

  try {
    // 1. Check authentication
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ticker } = await params;

    // 2. Find company in database
    const company = await prisma.company.findUnique({
      where: { ticker: ticker.toUpperCase() },
    });

    if (!company) {
      return NextResponse.json(
        { error: `Company with ticker ${ticker} not found in database` },
        { status: 404 }
      );
    }

    // 3. Create a PENDING enrichment record with source=FINNHUB
    const enrichment = await prisma.companyEnrichment.create({
      data: {
        companyId: company.id,
        ticker: ticker.toUpperCase(),
        source: "FINNHUB",
        status: "PENDING",
      },
    });

    // 4. Kick off the heavy work in the background
    after(() => processEnrichment(enrichment.id, company.id, ticker));

    // 5. Respond immediately
    return NextResponse.json(
      {
        success: true,
        ticker: ticker.toUpperCase(),
        enrichmentId: enrichment.id,
        status: "PENDING",
        source: "FINNHUB",
      },
      { status: 202 }
    );
  } catch (error: any) {
    console.error("[Enrich-Finnhub] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to enrich company with Finnhub" },
      { status: 500 }
    );
  }
}
