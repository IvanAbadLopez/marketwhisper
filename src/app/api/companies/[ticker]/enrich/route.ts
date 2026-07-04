/**
 * Enrich Company API Endpoint
 * Fetches public financial data from Yahoo Finance and generates AI analysis with Ollama
 */

import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { auth } from "@/lib/auth";
import { env } from "@/shared/config/env";
import { translateToSpanish } from "@/shared/api/translate";

interface YFinanceData {
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
  news?: Array<{
    title: string;
    publisher: string | null;
    link: string | null;
    publishedAt: string | null;
  }>;
  recommendations?: Array<{
    period: string;
    strongBuy: number;
    buy: number;
    hold: number;
    sell: number;
    strongSell: number;
  }>;
}

interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}

/**
 * Generate AI analysis prompt from financial data
 * Always in English for better AI quality - translation happens at UI layer
 */
function generateAnalysisPrompt(ticker: string, data: YFinanceData): string {
  const { companyInfo, financials, price, news, recommendations } = data;

  let prompt = `You are a financial analyst AI. Analyze the following data for ${ticker} (${companyInfo?.name || "Unknown Company"}) and provide a comprehensive investment analysis.

**Company Overview:**
- Sector: ${companyInfo?.sector || "N/A"}
- Industry: ${companyInfo?.industry || "N/A"}
- Market Cap: ${companyInfo?.marketCap ? `$${(companyInfo.marketCap / 1e9).toFixed(2)}B` : "N/A"}
- Employees: ${companyInfo?.employees?.toLocaleString() || "N/A"}

**Financial Metrics:**
- Revenue: ${financials?.revenue ? `$${(financials.revenue / 1e9).toFixed(2)}B` : "N/A"}
- Net Income: ${financials?.netIncome ? `$${(financials.netIncome / 1e9).toFixed(2)}B` : "N/A"}
- EPS: ${financials?.eps?.toFixed(2) || "N/A"}
- P/E Ratio: ${financials?.peRatio?.toFixed(2) || "N/A"}
- Debt/Equity: ${financials?.debtToEquity?.toFixed(2) || "N/A"}
- Profit Margin: ${financials?.profitMargins ? `${(financials.profitMargins * 100).toFixed(2)}%` : "N/A"}

**Current Price & Performance:**
- Current Price: $${price?.currentPrice?.toFixed(2) || "N/A"}
- Day Change: ${price?.dayChange ? `$${price.dayChange.toFixed(2)} (${price.dayChangePercent?.toFixed(2)}%)` : "N/A"}
- 52-Week High: $${price?.fiftyTwoWeekHigh?.toFixed(2) || "N/A"}
- 52-Week Low: $${price?.fiftyTwoWeekLow?.toFixed(2) || "N/A"}

**Recent News Headlines:**
${news && news.length > 0 ? news.slice(0, 5).map((n, i) => `${i + 1}. ${n.title} (${n.publisher || "Unknown"})`).join("\n") : "No recent news available."}

**Analyst Recommendations (Recent):**
${recommendations && recommendations.length > 0 ? recommendations.slice(-1).map(r => `Strong Buy: ${r.strongBuy}, Buy: ${r.buy}, Hold: ${r.hold}, Sell: ${r.sell}, Strong Sell: ${r.strongSell}`).join("\n") : "No analyst recommendations available."}

**Your Task:**
Provide a structured analysis in ENGLISH with the following sections:
1. **Executive Summary** (2-3 sentences)
2. **Financial Health** (assess profitability, debt levels, valuation)
3. **Market Position** (competitive advantages, sector trends)
4. **Recent Developments** (based on news headlines)
5. **Investment Outlook** (bullish, bearish, or neutral with reasoning)

Keep your analysis concise, objective, and data-driven. Focus on actionable insights.`;

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
        stream: false, // Get complete response at once
        options: {
          temperature: 0.7, // Balanced creativity/accuracy
          top_p: 0.9,
          num_predict: 1000, // Max tokens for response
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
 * Fetch financial data from enrichment service (Python FastAPI + yfinance)
 */
async function fetchYFinanceData(ticker: string): Promise<YFinanceData> {
  const enrichmentUrl = env.ENRICHMENT_SERVICE_URL;
  
  try {
    const response = await fetch(`${enrichmentUrl}/api/enrich/${ticker.toUpperCase()}`);
    
    if (!response.ok) {
      // Try to parse error details from response
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
        throw new Error(`Ticker ${ticker} not found in Yahoo Finance. Please verify the ticker symbol.`);
      }
      if (response.status === 429) {
        throw new Error(`Yahoo Finance rate limit exceeded. Please wait a few minutes before trying again.`);
      }
      throw new Error(`Enrichment service error: ${errorDetail}`);
    }

    const data: YFinanceData = await response.json();
    return data;
  } catch (error: any) {
    console.error("Failed to fetch yfinance data:", error);
    throw error;
  }
}

/**
 * Process enrichment in the background: fetch financial data, generate AI
 * analysis and update the enrichment record with the final result.
 * Runs after the HTTP response is sent (via Next.js `after()`).
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

    // 1. Fetch financial data from yfinance (via enrichment service, with retries)
    console.log(`[Enrich:${enrichmentId}] Fetching yfinance data for ${ticker}...`);
    const yfinanceData = await fetchYFinanceData(ticker);

    if (!yfinanceData.success) {
      throw new Error("Failed to fetch financial data");
    }

    // 2. Update company metadata from yfinance (more accurate than user-provided data)
    if (yfinanceData.companyInfo) {
      const { name, sector, industry, description, website, marketCap } = yfinanceData.companyInfo;
      const company = await prisma.company.findUnique({ where: { id: companyId } });
      if (company) {
        await prisma.company.update({
          where: { id: companyId },
          data: {
            name: name || company.name,
            sector: sector || company.sector,
            industry: industry || company.industry,
            description: description || company.description,
            website: website || company.website,
            marketCap: marketCap || company.marketCap,
          },
        });
      }
    }

    // 3. Generate AI analysis with Ollama
    console.log(`[Enrich:${enrichmentId}] Generating Ollama analysis for ${ticker}...`);
    const prompt = generateAnalysisPrompt(ticker, yfinanceData);
    const aiAnalysis = await generateOllamaAnalysis(prompt);

    // 4. Translate AI analysis to Spanish
    console.log(`[Enrich:${enrichmentId}] Translating analysis to Spanish...`);
    const aiAnalysisEs = await translateToSpanish(aiAnalysis);

    // 5. Store final result and mark as completed
    await prisma.companyEnrichment.update({
      where: { id: enrichmentId },
      data: {
        status: "COMPLETED",
        financialData: yfinanceData.financials as any,
        priceData: yfinanceData.price as any,
        newsHeadlines: yfinanceData.news as any,
        recommendations: yfinanceData.recommendations as any,
        aiAnalysis,
        aiAnalysisEs, // Store Spanish translation
        ollamaModel: "llama3.1:8b",
        errorMessage: null,
      },
    });

    console.log(`[Enrich:${enrichmentId}] Successfully enriched ${ticker}`);
  } catch (error: any) {
    console.error(`[Enrich:${enrichmentId}] Failed to enrich ${ticker}:`, error);
    // Mark as failed with the error message so the UI can surface it
    try {
      await prisma.companyEnrichment.update({
        where: { id: enrichmentId },
        data: {
          status: "FAILED",
          errorMessage: error?.message || "Failed to enrich company",
        },
      });
    } catch (updateError) {
      console.error(`[Enrich:${enrichmentId}] Could not mark as FAILED:`, updateError);
    }
  }
}

/**
 * POST /api/companies/[ticker]/enrich
 * Kicks off a background enrichment job and returns immediately with the
 * enrichment id. Poll GET /api/companies/[ticker]/enrich/[id] for status.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  // Lazy load prisma to avoid database connection during build
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

    // 3. Create a PENDING enrichment record
    const enrichment = await prisma.companyEnrichment.create({
      data: {
        companyId: company.id,
        ticker: ticker.toUpperCase(),
        source: "YAHOO",
        status: "PENDING",
      },
    });

    // 4. Kick off the heavy work in the background (runs after the response)
    after(() => processEnrichment(enrichment.id, company.id, ticker));

    // 5. Respond immediately so the UI can start polling
    return NextResponse.json(
      {
        success: true,
        ticker: ticker.toUpperCase(),
        enrichmentId: enrichment.id,
        status: "PENDING",
        source: "YAHOO",
      },
      { status: 202 }
    );
  } catch (error: any) {
    console.error("[Enrich] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to enrich company" },
      { status: 500 }
    );
  }
}
