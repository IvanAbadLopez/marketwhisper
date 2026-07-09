/**
 * Background processing logic for text analysis jobs
 * @module features/analyze-text/api/processAnalysis
 */

import { after } from "next/server";
import { analyzeText, prisma } from "@/shared";
import { processTranslation } from "./processTranslation";

interface AnalysisJobResult {
  analysisIds: string[];
  companyIds: string[];
  count: number;
}

/**
 * Process a text analysis job in the background
 * Updates Job status and creates Analysis records
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

    // Analyze text with Ollama AI - returns array of all companies detected
    const aiResults = await analyzeText(text);

    // Check if AI detected any companies
    if (!aiResults || aiResults.length === 0) {
      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: "FAILED",
          errorMessage: "No companies identified in the text. Please provide more specific information about companies or stock tickers.",
        },
      });
      return;
    }

    // Process each detected company in parallel
    const results = await Promise.all(
      aiResults.map(async (aiResult) => {
        // Normalize ticker (remove $ symbol if present)
        const normalizedTicker = aiResult.ticker.replace(/^\$/, "").trim().toUpperCase();

        // Find or create company
        let company = await prisma.company.findUnique({
          where: { ticker: normalizedTicker },
        });

        if (!company) {
          // Create new company with AI-detected data
          company = await prisma.company.create({
            data: {
              ticker: normalizedTicker,
              name: aiResult.companyName,
              analysisCount: 0,
            },
          });
        }

        // Create analysis record
        const analysis = await prisma.analysis.create({
          data: {
            text,
            source: source || null,
            companyId: company.id,
            ticker: normalizedTicker,
            sentiment: aiResult.sentiment,
            reliabilityScore: aiResult.reliabilityScore,
            reasoning: aiResult.reasoning,
            reasoningEs: null, // Translation will be done in background
            jobId, // Link to job for tracking
          },
        });

        // Recalculate company aggregates
        await updateCompanyAggregates(company.id);

        return {
          analysisId: analysis.id,
          companyId: company.id,
        };
      })
    );

    // Prepare result data
    const jobResult: AnalysisJobResult = {
      analysisIds: results.map((r) => r.analysisId),
      companyIds: results.map((r) => r.companyId),
      count: results.length,
    };

    // Get first ticker for job tracking (if multiple, show count)
    const firstTicker = aiResults[0].ticker.replace(/^\$/, "").trim().toUpperCase();
    const tickerDisplay = results.length > 1 ? `${firstTicker} +${results.length - 1}` : firstTicker;

    // Update job status to COMPLETED with result
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        ticker: tickerDisplay, // Update from PENDING to actual ticker(s)
        result: jobResult as any, // Store as JSON
      },
    });

    console.log(`[Job ${jobId}] Analysis completed successfully: ${results.length} companies detected`);

    // Kick off background translation (non-blocking)
    after(() => processTranslation(jobResult.analysisIds));
  } catch (error: unknown) {
    console.error(`[Job ${jobId}] Analysis failed:`, error);

    // Update job status to FAILED
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
