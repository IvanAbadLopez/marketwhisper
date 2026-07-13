/**
 * Background processing logic for text analysis jobs
 * @module features/analyze-text/api/processAnalysis
 */

import { 
  detectCompanies,
  analyzeWithFinancials,
  resolveTicker,
  fetchFinnhubData,
  createFinancialSnapshot,
  getCachedFinnhub,
  prisma,
  type FinnhubData,
} from "@/shared";
import { recomputeCompanyValuation } from "@/entities/company/api/recomputeValuation";

interface AnalysisJobResult {
  analysisIds: string[];
  companyIds: string[];
  count: number;
}

/**
 * Process a text analysis job in the background (2-call LLM + Finnhub enrichment)
 * Updates Job status and creates Analysis records with financial snapshots
 */
export async function processAnalysis(
  jobId: string,
  text: string,
  source: string | undefined,
  userId: string
): Promise<void> {
  try {
    // Update job status to PROCESSING
    await prisma.job.update({
      where: { id: jobId },
      data: { status: "PROCESSING" },
    });

    // PHASE 1: Detect companies (LLM call #1 - lightweight)
    console.log(`[Job ${jobId}] Phase 1: Detecting companies...`);
    const detections = await detectCompanies(text);

    if (!detections || detections.length === 0) {
      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: "FAILED",
          errorMessage: "No companies identified in the text. Please provide more specific information about companies or stock tickers.",
        },
      });
      return;
    }

    console.log(`[Job ${jobId}] Detected ${detections.length} companies: ${detections.map(d => d.companyName).join(', ')}`);

    // PHASE 2: Resolve tickers and find/create companies
    console.log(`[Job ${jobId}] Phase 2: Resolving tickers and companies...`);
    const companiesData: Array<{
      ticker: string;
      companyName: string;
      company: { id: string; ticker: string };
      finnhubData: FinnhubData | null;
    }> = [];

    for (const detection of detections) {
      let ticker = detection.ticker.replace(/^\$/, "").trim().toUpperCase();

      // Resolve ticker if missing
      if (!ticker && detection.companyName) {
        console.log(`[processAnalysis] Ticker missing for "${detection.companyName}", resolving via Finnhub...`);
        ticker = await resolveTicker(detection.companyName);
        
        if (!ticker) {
          console.warn(`[processAnalysis] Could not resolve ticker for "${detection.companyName}", skipping`);
          continue;
        }
      }

      if (!ticker) {
        console.warn(`[processAnalysis] No ticker and no companyName for detection, skipping`);
        continue;
      }

      // Find or create company
      let company = await prisma.company.findUnique({
        where: { ticker },
      });

      if (!company) {
        company = await prisma.company.create({
          data: {
            ticker,
            name: detection.companyName || ticker,
            analysisCount: 0,
          },
        });
        console.log(`[processAnalysis] Created new company: ${ticker}`);
      }

      companiesData.push({
        ticker,
        companyName: detection.companyName || company.name,
        company: { id: company.id, ticker: company.ticker },
        finnhubData: null, // Will be fetched in Phase 3
      });
    }

    if (companiesData.length === 0) {
      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: "FAILED",
          errorMessage: "No companies could be identified or resolved. Please provide more specific company information or stock tickers.",
        },
      });
      return;
    }

    // PHASE 3: Fetch Finnhub data (with cache, serial to respect rate limits)
    console.log(`[Job ${jobId}] Phase 3: Fetching financial data (with cache)...`);
    for (const companyData of companiesData) {
      try {
        // Try cache first (24h TTL)
        const cached = await getCachedFinnhub(companyData.company.id);
        
        if (cached) {
          console.log(`[processAnalysis] Using cached Finnhub data for ${companyData.ticker}`);
          // Reconstruct FinnhubData from snapshot (minimal structure for prompt)
          companyData.finnhubData = {
            success: true,
            ticker: companyData.ticker,
            price: {
              currentPrice: cached.currentPrice,
              previousClose: null,
              dayChange: null,
              dayChangePercent: null,
              fiftyTwoWeekHigh: cached.fiftyTwoWeekHigh,
              fiftyTwoWeekLow: cached.fiftyTwoWeekLow,
              volume: null,
              avgVolume: null,
            },
            financials: {
              revenue: null,
              netIncome: null,
              eps: cached.eps,
              peRatio: cached.peRatio,
              debtToEquity: null,
              dividendYield: null,
              profitMargins: null,
              bookValuePerShare: null,
              roe: null,
              epsGrowth: null,
            },
            recommendations: cached.analystConsensus ? [{
              strongBuy: 0, buy: 0, hold: 0, sell: 0, strongSell: 0,
              period: cached.fetchedAt.substring(0, 10),
            }] : undefined,
          };
        } else {
          // Fetch fresh data
          console.log(`[processAnalysis] Fetching fresh Finnhub data for ${companyData.ticker}...`);
          companyData.finnhubData = await fetchFinnhubData(companyData.ticker);
        }
      } catch (error) {
        console.warn(`[processAnalysis] Failed to fetch Finnhub data for ${companyData.ticker}:`, error);
        companyData.finnhubData = null; // Fallback: analyze without financial data
      }
    }

    // PHASE 4: Analyze with financials (LLM call #2 - single call for ALL companies)
    console.log(`[Job ${jobId}] Phase 4: Analyzing with financial data (1 LLM call for all companies)...`);
    const enrichedAnalyses = await analyzeWithFinancials(
      text,
      companiesData.map(cd => ({
        ticker: cd.ticker,
        companyName: cd.companyName,
        finnhubData: cd.finnhubData,
      }))
    );

    if (!enrichedAnalyses || enrichedAnalyses.length === 0) {
      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: "FAILED",
          errorMessage: "AI analysis failed to produce any results. Please try again.",
        },
      });
      return;
    }

    // PHASE 5: Create Analysis records with financial snapshots
    console.log(`[Job ${jobId}] Phase 5: Saving analyses with financial snapshots...`);
    const results = await Promise.all(
      enrichedAnalyses.map(async (aiResult) => {
        const ticker = aiResult.ticker.replace(/^\$/, "").trim().toUpperCase();
        
        // Find matching company data
        const companyData = companiesData.find(cd => cd.ticker === ticker);
        if (!companyData) {
          console.warn(`[processAnalysis] No company data found for ticker ${ticker}, skipping`);
          return null;
        }

        // Create financial snapshot if we have Finnhub data
        const financialSnapshot = companyData.finnhubData 
          ? createFinancialSnapshot(companyData.finnhubData)
          : null;

        // Create analysis record
        const analysis = await prisma.analysis.create({
          data: {
            text,
            source: source || null,
            companyId: companyData.company.id,
            ticker,
            sentiment: aiResult.sentiment,
            reliabilityScore: aiResult.reliabilityScore,
            reasoning: aiResult.reasoning,
            financialSnapshot: financialSnapshot as any,
            jobId,
          },
        });

        // Recalculate company aggregates
        await updateCompanyAggregates(companyData.company.id);

        // Recalculate valuation (global score + target price)
        await recomputeCompanyValuation(companyData.company.id);

        return {
          analysisId: analysis.id,
          companyId: companyData.company.id,
        };
      })
    );

    const validResults = results.filter((r): r is { analysisId: string; companyId: string } => r !== null);

    if (validResults.length === 0) {
      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: "FAILED",
          errorMessage: "No analyses could be saved. Please try again.",
        },
      });
      return;
    }

    // Prepare result data
    const jobResult: AnalysisJobResult = {
      analysisIds: validResults.map((r) => r.analysisId),
      companyIds: validResults.map((r) => r.companyId),
      count: validResults.length,
    };

    // Get first ticker for job tracking
    const firstCompany = await prisma.company.findUnique({
      where: { id: validResults[0].companyId },
      select: { ticker: true },
    });
    const firstTicker = firstCompany?.ticker || 'UNKNOWN';
    const tickerDisplay = validResults.length > 1 ? `${firstTicker} +${validResults.length - 1}` : firstTicker;

    // Update job status to COMPLETED
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        ticker: tickerDisplay,
        result: jobResult as any,
      },
    });

    console.log(`[Job ${jobId}] Analysis completed successfully: ${validResults.length} companies analyzed (2 LLM calls total)`);
  } catch (error: unknown) {
    console.error(`[Job ${jobId}] Analysis failed:`, error);

    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : "Failed to analyze text",
      },
    });
  }
}

/**
 * Update company aggregate scores incrementally (optimized)
 * Uses moving average formula instead of recalculating from all analyses
 */
async function updateCompanyAggregates(companyId: string) {
  // Get current company aggregates
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      avgSentimentScore: true,
      avgReliabilityScore: true,
      analysisCount: true,
    },
  });

  if (!company) {
    return;
  }

  // Get the most recent analysis for this company
  const latestAnalysis = await prisma.analysis.findFirst({
    where: { companyId },
    orderBy: { createdAt: 'desc' },
    select: {
      sentiment: true,
      reliabilityScore: true,
    },
  });

  if (!latestAnalysis) {
    return;
  }

  // Convert sentiment to numeric value
  const sentimentValue = latestAnalysis.sentiment === "BULLISH" ? 1 
                        : latestAnalysis.sentiment === "BEARISH" ? -1 
                        : 0;

  const oldCount = company.analysisCount;
  const newCount = oldCount + 1;

  // Calculate new averages using incremental formula
  // newAvg = (oldAvg * oldCount + newValue) / newCount
  const newAvgSentiment = oldCount === 0 
    ? sentimentValue 
    : ((company.avgSentimentScore || 0) * oldCount + sentimentValue) / newCount;
    
  const newAvgReliability = oldCount === 0
    ? latestAnalysis.reliabilityScore
    : ((company.avgReliabilityScore || 0) * oldCount + latestAnalysis.reliabilityScore) / newCount;

  // Update company with new aggregates
  await prisma.company.update({
    where: { id: companyId },
    data: {
      avgSentimentScore: newAvgSentiment,
      avgReliabilityScore: newAvgReliability,
      analysisCount: newCount,
    },
  });
}

/**
 * Recalculate company aggregates from scratch (for data integrity checks)
 * Use only for migrations or corrections, not for regular updates
 */
export async function recalculateCompanyAggregatesFromScratch(companyId: string) {
  // Get all analyses for this company
  const analyses = await prisma.analysis.findMany({
    where: { companyId },
    select: {
      sentiment: true,
      reliabilityScore: true,
    },
  });

  if (analyses.length === 0) {
    // Reset aggregates if no analyses
    await prisma.company.update({
      where: { id: companyId },
      data: {
        avgSentimentScore: null,
        avgReliabilityScore: null,
        analysisCount: 0,
      },
    });
    return;
  }

  // Convert sentiment to numeric values for averaging
  const sentimentValues = analyses.map((a) => {
    switch (a.sentiment) {
      case "BULLISH":
        return 1;
      case "BEARISH":
        return -1;
      default:
        return 0;
    }
  });

  // Calculate averages
  const avgSentiment = sentimentValues.reduce((sum: number, val) => sum + val, 0) / sentimentValues.length;
  const avgReliability = analyses.reduce((sum: number, a) => sum + a.reliabilityScore, 0) / analyses.length;

  // Update company
  await prisma.company.update({
    where: { id: companyId },
    data: {
      avgSentimentScore: avgSentiment,
      avgReliabilityScore: avgReliability,
      analysisCount: analyses.length,
    },
  });
}
