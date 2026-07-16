/**
 * Valuation orchestrator: reads company data, runs formulas, updates DB
 * Server-side only (uses Prisma)
 * @module entities/company/api
 */

import { prisma } from '@/shared/api/prisma';
import { computeValuation, type ValuationInputs } from '@/shared/lib/valuation';
import { calcAnalystScore } from '@/features/enrich-company/lib/analystScore';

/**
 * Recompute and persist valuation for a company
 * Called after new analysis or enrichment
 */
export async function recomputeCompanyValuation(companyId: string): Promise<void> {
  try {
    console.log(`[recomputeValuation] Starting for company ${companyId}`);
    
    // 1. Fetch company with aggregates
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        ticker: true,
        avgSentimentScore: true,
        avgReliabilityScore: true,
        analysisCount: true,
      },
    });

    if (!company) {
      console.warn(`[recomputeValuation] Company ${companyId} not found`);
      return;
    }

    // 2. Fetch latest enrichment (for financial data)
    const latestEnrichment = await prisma.companyEnrichment.findFirst({
      where: {
        companyId,
        status: 'COMPLETED',
      },
      orderBy: { createdAt: 'desc' },
      select: {
        financialData: true,
        priceData: true,
        recommendations: true,
      },
    });

    console.log(`[recomputeValuation] Enrichment found: ${!!latestEnrichment}`);

    // 3. Build inputs for valuation formulas
    const financialData = latestEnrichment?.financialData as Record<string, unknown> | null;
    const priceData = latestEnrichment?.priceData as Record<string, unknown> | null;
    const recommendations = latestEnrichment?.recommendations as unknown[] | null;

    const inputs: ValuationInputs = {
      // From enrichment financialData
      eps: financialData?.eps ?? null,
      peRatio: financialData?.peRatio ?? null,
      bookValuePerShare: financialData?.bookValuePerShare ?? null,
      roe: financialData?.roe ?? null,
      profitMargins: financialData?.profitMargins ?? null,
      debtToEquity: financialData?.debtToEquity ?? null,
      dividendYield: financialData?.dividendYield ?? null,
      epsGrowth: financialData?.epsGrowth ?? null,
      
      // From enrichment priceData
      currentPrice: priceData?.currentPrice ?? null,
      fiftyTwoWeekHigh: priceData?.fiftyTwoWeekHigh ?? null,
      fiftyTwoWeekLow: priceData?.fiftyTwoWeekLow ?? null,
      
      // From enrichment recommendations (compute analyst score)
      analystScore: recommendations?.length
        ? calcAnalystScore(recommendations[recommendations.length - 1])
        : null,
      
      // From company aggregates
      avgSentimentScore: company.avgSentimentScore,
      avgReliabilityScore: company.avgReliabilityScore,
      analysisCount: company.analysisCount,
    };

    // 4. Compute valuation
    const result = computeValuation(inputs);
    
    console.log(`[recomputeValuation] ${company.ticker} - Score: ${result.globalScore}, Target: ${result.targetPrice}`);

    // 5. Update company with results
    await prisma.company.update({
      where: { id: companyId },
      data: {
        globalScore: result.globalScore,
        globalScoreLabel: result.globalScoreLabel,
        targetPrice: result.targetPrice,
        valuationBreakdown: result.breakdown as Record<string, unknown>,
        valuationUpdatedAt: new Date(),
      },
    });

    console.log(`[recomputeValuation] Successfully updated ${company.ticker}`);
  } catch (error) {
    console.error(`[recomputeValuation] Failed for company ${companyId}:`, error);
    // Don't throw - valuation is non-critical, don't break parent flow
  }
}
