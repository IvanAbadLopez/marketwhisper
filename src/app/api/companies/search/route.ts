/**
 * Company Search API - proxies Finnhub symbol lookup
 * GET /api/companies/search?q=query
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { searchFinnhubSymbols } from "@/shared/api/finnhub";

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

    // 4. Check which tickers already exist in database
    const tickers = results.map((r) => r.symbol.toUpperCase());
    const existingCompanies = await prisma.company.findMany({
      where: { ticker: { in: tickers } },
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
    console.error("[Company Search] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to search companies";
    
    // Handle specific Finnhub errors
    if (message.includes('rate limit')) {
      return NextResponse.json({ error: message }, { status: 429 });
    }
    if (message.includes('FINNHUB_API_KEY')) {
      return NextResponse.json({ error: message }, { status: 503 });
    }
    
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
