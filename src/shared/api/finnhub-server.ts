/**
 * Finnhub Server-Only Utilities
 * Functions that use Prisma and can only run on the server
 * @module shared/api/finnhub-server
 */

import { prisma } from '@/shared/api/prisma';
import type { FinancialSnapshot } from './finnhub';

/**
 * Get cached financial data from recent Analysis records
 * Returns cached data if found within TTL, otherwise null
 */
export async function getCachedFinnhub(
  companyId: string,
  ttlHours: number = 24
): Promise<FinancialSnapshot | null> {
  const cutoff = new Date(Date.now() - ttlHours * 60 * 60 * 1000);
  
  try {
    // Find the most recent analysis with financialSnapshot for this company
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
