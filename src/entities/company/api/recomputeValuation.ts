import { prisma } from '@/shared/api/prisma';
import { computeValuation, type ValuationInputs } from '@/shared/lib/valuation';
import { calcAnalystScore, type AnalystRecommendation } from '@/features/enrich-company/lib/analystScore';

export async function recomputeCompanyValuation(companyId: string): Promise<void> {
  try {
    console.log(`[recomputeValuation] Starting for company ${companyId}`);
    
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

    const financialData = (latestEnrichment?.financialData ?? null) as Record<string, number | null> | null;
    const priceData = (latestEnrichment?.priceData ?? null) as Record<string, number | null> | null;
    const recommendations = (latestEnrichment?.recommendations ?? null) as AnalystRecommendation[] | null;

    const getNumber = (obj: Record<string, unknown> | null, key: string): number | null => {
      const value = obj?.[key];
      return typeof value === 'number' ? value : null;
    };

    const inputs: ValuationInputs = {
      eps: getNumber(financialData, 'eps'),
      peRatio: getNumber(financialData, 'peRatio'),
      bookValuePerShare: getNumber(financialData, 'bookValuePerShare'),
      roe: getNumber(financialData, 'roe'),
      profitMargins: getNumber(financialData, 'profitMargins'),
      debtToEquity: getNumber(financialData, 'debtToEquity'),
      dividendYield: getNumber(financialData, 'dividendYield'),
      epsGrowth: getNumber(financialData, 'epsGrowth'),
      
      currentPrice: getNumber(priceData, 'currentPrice'),
      fiftyTwoWeekHigh: getNumber(priceData, 'fiftyTwoWeekHigh'),
      fiftyTwoWeekLow: getNumber(priceData, 'fiftyTwoWeekLow'),
      
      analystScore: recommendations?.length
        ? calcAnalystScore(recommendations[recommendations.length - 1])
        : null,
      
      avgSentimentScore: company.avgSentimentScore,
      avgReliabilityScore: company.avgReliabilityScore,
      analysisCount: company.analysisCount,
    };

    const result = computeValuation(inputs);
    
    console.log(`[recomputeValuation] ${company.ticker} - Score: ${result.globalScore}, Target: ${result.targetPrice}`);

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
  }
}
