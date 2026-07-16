import { prisma } from '@/shared/api/prisma';
import type { FinancialSnapshot } from './finnhub';

export async function getCachedFinnhub(
  companyId: string,
  ttlHours: number = 24
): Promise<FinancialSnapshot | null> {
  const cutoff = new Date(Date.now() - ttlHours * 60 * 60 * 1000);
  
  try {
    const recentAnalysis = await prisma.analysis.findFirst({
      where: {
        companyId,
        createdAt: { gte: cutoff },
      },
      orderBy: { createdAt: 'desc' },
      select: { financialSnapshot: true, createdAt: true },
    });
    
    if (!recentAnalysis || !recentAnalysis.financialSnapshot) {
      return null;
    }
    
    console.log(`[getCachedFinnhub] Cache hit for company ${companyId} (age: ${Math.round((Date.now() - new Date(recentAnalysis.createdAt).getTime()) / 1000 / 60)} min)`);
    
    return recentAnalysis.financialSnapshot as unknown as FinancialSnapshot;
  } catch (error) {
    console.error('[getCachedFinnhub] Error querying cache:', error);
    return null;
  }
}
