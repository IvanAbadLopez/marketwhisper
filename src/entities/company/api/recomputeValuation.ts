/**
 * Valuation orchestrator: reads company data, runs formulas, updates DB
 * Server-side only (uses Prisma)
 * @module entities/company/api
 */

import { prisma } from '@/shared/api/prisma';
import { computeValuation, type ValuationInputs } from '@/shared/lib/valuation';
import { calcAnalystScore, type AnalystRecommendation } from '@/features/enrich-company/lib/analystScore';

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
    const financialData = (latestEnrichment?.financialData ?? null) as Record<string, number | null> | null;
    const priceData = (latestEnrichment?.priceData ?? null) as Record<string, number | null> | null;
    const recommendations = (latestEnrichment?.recommendations ?? null) as AnalystRecommendation[] | null;

    // Helper to safely extract numeric values
    const getNumber = (obj: Record<string, unknown> | null, key: string): number | null => {
      const value = obj?.[key];
      return typeof value === 'number' ? value : null;
    };

    const inputs: ValuationInputs = {
      // From enrichment financialData
      eps: getNumber(financialData, 'eps'),
      peRatio: getNumber(financialData, 'peRatio'),
      bookValuePerShare: getNumber(financialData, 'bookValuePerShare'),
      roe: getNumber(financialData, 'roe'),
      profitMargins: getNumber(financialData, 'profitMargins'),
      debtToEquity: getNumber(financialData, 'debtToEquity'),
      dividendYield: getNumber(financialData, 'dividendYield'),
      epsGrowth: getNumber(financialData, 'epsGrowth'),
      
      // From enrichment priceData
      currentPrice: getNumber(priceData, 'currentPrice'),
      fiftyTwoWeekHigh: getNumber(priceData, 'fiftyTwoWeekHigh'),
      fiftyTwoWeekLow: getNumber(priceData, 'fiftyTwoWeekLow'),
      
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
        valuationBreakdown: result.breakdown,
        valuationUpdatedAt: new Date(),
      },
    });

    console.log(`[recomputeValuation] Successfully updated ${company.ticker}`);
  } catch (error) {
    console.error(`[recomputeValuation] Failed for company ${companyId}:`, error);
    // Don't throw - valuation is non-critical, don't break parent flow
  }
}
