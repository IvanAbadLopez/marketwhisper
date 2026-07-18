import { 
  detectCompanies,
  analyzeWithFinancials,
  resolveTicker,
  fetchFinnhubData,
  createFinancialSnapshot,
  type FinnhubData,
} from "@/shared";
import { getCachedFinnhub } from "@/shared/api/finnhub-server";
import { prisma } from "@/shared/api/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { assertJobNotCancelled, JobCancelledError } from "@/shared/lib/jobCancellation";
import { recomputeCompanyValuation } from "@/entities/company/api/recomputeValuation";
import { processEnrichment } from "@/features/enrich-company/api/processEnrichment";

interface AnalysisJobResult {
  analysisIds: string[];
  companyIds: string[];
  count: number;
}

export async function processAnalysis(
  jobId: string,
  text: string,
  source: string | undefined,
  userId: string
): Promise<void> {
  try {
    await prisma.job.update({
      where: { id: jobId },
      data: { status: "PROCESSING" },
    });

    await assertJobNotCancelled(jobId);

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

    console.log(`[Job ${jobId}] Phase 2: Resolving tickers and companies...`);
    const companiesData: Array<{
      ticker: string;
      companyName: string;
      company: { id: string; ticker: string };
      finnhubData: FinnhubData | null;
      isNewCompany: boolean;
    }> = [];

    for (const detection of detections) {
      let ticker = detection.ticker.replace(/^\$/, "").trim().toUpperCase();

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

      let company = await prisma.company.findFirst({
        where: {
          userId,
          ticker,
        },
      });

      let isNewCompany = false;
      if (!company) {
        company = await prisma.company.create({
          data: {
            userId,
            ticker,
            name: detection.companyName || ticker,
            analysisCount: 0,
          },
        });
        isNewCompany = true;
        console.log(`[processAnalysis] Created new company: ${ticker} - will auto-enrich`);
      }

      companiesData.push({
        ticker,
        companyName: detection.companyName || company.name,
        company: { id: company.id, ticker: company.ticker },
        finnhubData: null,
        isNewCompany,
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

    console.log(`[Job ${jobId}] Phase 3: Fetching financial data (with cache)...`);
    for (const companyData of companiesData) {
      try {
        const cached = await getCachedFinnhub(companyData.company.id);
        
        if (cached) {
          console.log(`[processAnalysis] Using cached Finnhub data for ${companyData.ticker}`);
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
          console.log(`[processAnalysis] Fetching fresh Finnhub data for ${companyData.ticker}...`);
          companyData.finnhubData = await fetchFinnhubData(companyData.ticker);
        }
      } catch (error) {
        console.warn(`[processAnalysis] Failed to fetch Finnhub data for ${companyData.ticker}:`, error);
        companyData.finnhubData = null;
      }
    }

    await assertJobNotCancelled(jobId);

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

    await assertJobNotCancelled(jobId);

    console.log(`[Job ${jobId}] Phase 5: Saving analyses with financial snapshots...`);
    const results = await Promise.all(
      enrichedAnalyses.map(async (aiResult) => {
        const ticker = aiResult.ticker.replace(/^\$/, "").trim().toUpperCase();
        
        const companyData = companiesData.find(cd => cd.ticker === ticker);
        if (!companyData) {
          console.warn(`[processAnalysis] No company data found for ticker ${ticker}, skipping`);
          return null;
        }

        const financialSnapshot = companyData.finnhubData 
          ? createFinancialSnapshot(companyData.finnhubData)
          : null;

        const analysis = await prisma.analysis.create({
          data: {
            userId,
            text,
            source: source || null,
            companyId: companyData.company.id,
            ticker,
            sentiment: aiResult.sentiment,
            reliabilityScore: aiResult.reliabilityScore,
            reasoning: aiResult.reasoning,
            financialSnapshot: (financialSnapshot ?? undefined) as Prisma.InputJsonValue | undefined,
            jobId,
          },
        });

        await updateCompanyAggregates(companyData.company.id);

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

    const jobResult: AnalysisJobResult = {
      analysisIds: validResults.map((r) => r.analysisId),
      companyIds: validResults.map((r) => r.companyId),
      count: validResults.length,
    };

    const firstCompany = await prisma.company.findUnique({
      where: { id: validResults[0].companyId },
      select: { ticker: true },
    });
    const firstTicker = firstCompany?.ticker || 'UNKNOWN';
    const tickerDisplay = validResults.length > 1 ? `${firstTicker} +${validResults.length - 1}` : firstTicker;

    await prisma.job.updateMany({
      where: { 
        id: jobId,
        status: "PROCESSING",
      },
      data: {
        status: "COMPLETED",
        ticker: tickerDisplay,
        result: jobResult as unknown as Prisma.InputJsonValue,
      },
    });

    console.log(`[Job ${jobId}] Analysis completed successfully: ${validResults.length} companies analyzed (2 LLM calls total)`);

    if (companiesData.length > 0) {
      console.log(`[Job ${jobId}] Auto-enriching ${companiesData.length} companies...`);
      
      for (const companyData of companiesData) {
        try {
          const enrichment = await prisma.companyEnrichment.create({
            data: {
              userId,
              companyId: companyData.company.id,
              ticker: companyData.ticker,
              source: "FINNHUB",
              status: "PENDING",
            },
          });

          console.log(`[Job ${jobId}] Starting enrichment for ${companyData.ticker} (ID: ${enrichment.id})...`);
          
          await processEnrichment(
            enrichment.id,
            companyData.company.id,
            companyData.ticker,
            undefined,
            userId
          );
          
          console.log(`[Job ${jobId}] Enrichment completed for ${companyData.ticker}`);
        } catch (error) {
          console.error(`[Job ${jobId}] Enrichment failed for ${companyData.ticker}:`, error);
        }
      }
    }
  } catch (error: unknown) {
    if (error instanceof JobCancelledError) {
      console.log(`[Job ${jobId}] Analysis cancelled by user`);
      return;
    }

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

async function updateCompanyAggregates(companyId: string) {
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

  const sentimentValue = latestAnalysis.sentiment === "BULLISH" ? 1 
                        : latestAnalysis.sentiment === "BEARISH" ? -1 
                        : 0;

  const oldCount = company.analysisCount;
  const newCount = oldCount + 1;

  const newAvgSentiment = oldCount === 0 
    ? sentimentValue 
    : ((company.avgSentimentScore || 0) * oldCount + sentimentValue) / newCount;
    
  const newAvgReliability = oldCount === 0
    ? latestAnalysis.reliabilityScore
    : ((company.avgReliabilityScore || 0) * oldCount + latestAnalysis.reliabilityScore) / newCount;

  await prisma.company.update({
    where: { id: companyId },
    data: {
      avgSentimentScore: newAvgSentiment,
      avgReliabilityScore: newAvgReliability,
      analysisCount: newCount,
    },
  });
}

export async function recalculateCompanyAggregatesFromScratch(companyId: string) {
  const analyses = await prisma.analysis.findMany({
    where: { companyId },
    select: {
      sentiment: true,
      reliabilityScore: true,
    },
  });

  if (analyses.length === 0) {
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

  const avgSentiment = sentimentValues.reduce((sum: number, val) => sum + val, 0) / sentimentValues.length;
  const avgReliability = analyses.reduce((sum: number, a) => sum + a.reliabilityScore, 0) / analyses.length;

  await prisma.company.update({
    where: { id: companyId },
    data: {
      avgSentimentScore: avgSentiment,
      avgReliabilityScore: avgReliability,
      analysisCount: analyses.length,
    },
  });
}
