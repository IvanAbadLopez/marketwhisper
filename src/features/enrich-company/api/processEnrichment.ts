/**
 * Shared server utilities for company enrichment with Finnhub + Ollama
 * @module features/enrich-company/api/processEnrichment
 */

import { env } from "@/shared/config/env";
import { 
  fetchFinnhubData, 
  formatFinancialsBlock,
  calcAnalystScore,
  analystScoreLabel,
  type FinnhubData,
  type AnalystRecommendation,
} from "@/shared";
import { recomputeCompanyValuation } from "@/entities/company/api/recomputeValuation";

interface UserAnalysis {
  text: string;
  source: string | null;
  sentiment: string;
  reliabilityScore: number;
  reasoning: string;
  createdAt: Date;
}

// FinnhubData and AnalystRecommendation now imported from @/shared

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
  // Use shared formatFinancialsBlock for consistency
  let prompt = `You are a financial analyst AI. Analyze ${ticker} using Finnhub data and user analyses.\n\n**Data:**\n${formatFinancialsBlock(ticker, data)}`;

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

// normalizeTicker now imported from @/shared

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

// fetchFinnhubData now imported from @/shared

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
        financialData: finnhubData.financials as any,  // Store for valuation
        priceData: finnhubData.price as any,            // Store for valuation
        recommendations: (finnhubData.recommendations ?? undefined) as any,
        aiAnalysis,
        ollamaModel: env.OLLAMA_MODEL,
        errorMessage: null,
      },
    });

    // 5b. Recalculate valuation (global score + target price)
    await recomputeCompanyValuation(companyId);

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
