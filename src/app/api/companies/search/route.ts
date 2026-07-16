/**
 * Company Search API - proxies Finnhub symbol lookup
 * GET /api/companies/search?q=query
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { searchFinnhubSymbols } from "@/shared/api/finnhub";
import { checkRateLimit, createErrorResponse, getSafeErrorMessage } from "@/shared";

// Vercel serverless function timeout (30s for external API calls)
export const maxDuration = 30;

interface FinnhubSearchResult {
  symbol: string;
  description: string;
  displaySymbol: string;
  type: string;
}

interface SearchResultWithExists extends FinnhubSearchResult {
  existsInDatabase: boolean;
}

export async function GET(request: NextRequest) {
  const { prisma } = await import("@/shared/api/prisma");

  try {
    // 1. Check authentication
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit search requests by user (30 searches per minute)
    const rateLimitResult = checkRateLimit(`search:${session.user.id}`, {
      max: 30,
      windowMs: 60 * 1000, // 1 minute
    });

    if (!rateLimitResult.success) {
      const retryAfter = Math.ceil((rateLimitResult.reset - Date.now()) / 1000);
      return NextResponse.json(
        { error: 'Too many search requests. Please slow down.' },
        { 
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
          },
        }
      );
    }

    // 2. Get search query
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query || !query.trim()) {
      return NextResponse.json(
        { error: "Query parameter 'q' is required" },
        { status: 400 }
      );
    }

    // 3. Search Finnhub directly
    const results = await searchFinnhubSymbols(query);

    // 4. Check which tickers already exist in database for this user
    const tickers = results.map((r) => r.symbol.toUpperCase());
    const existingCompanies = await prisma.company.findMany({
      where: {
        userId: session.user.id as string,
        ticker: { in: tickers },
      },
      select: { ticker: true },
    });

    const existingTickers = new Set(existingCompanies.map((c) => c.ticker));

    // 5. Mark results with existsInDatabase flag
    const resultsWithExists: SearchResultWithExists[] = results.map((result) => ({
      ...result,
      existsInDatabase: existingTickers.has(result.symbol.toUpperCase()),
    }));

    return NextResponse.json({
      success: true,
      query,
      count: results.length,
      results: resultsWithExists,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = getSafeErrorMessage(error, 'Failed to search companies');
    
    // Handle specific errors (rate limit, API key)
    if (message.includes('rate limit')) {
      return NextResponse.json({ error: message }, { status: 429 });
    }
    if (message.includes('FINNHUB_API_KEY')) {
      return NextResponse.json({ error: message }, { status: 503 });
    }
    
    return createErrorResponse(error, message, 500, 'Search');
  }
}
