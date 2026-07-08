/**
 * Company Search API - proxies Finnhub symbol lookup
 * GET /api/companies/search?q=query
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { env } from "@/shared/config/env";

interface FinnhubSearchResult {
  symbol: string;
  description: string;
  displaySymbol: string;
  type: string;
}

interface FinnhubSearchResponse {
  success: boolean;
  query: string;
  count: number;
  results: FinnhubSearchResult[];
  timestamp: string;
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

    // 3. Call enrichment service search endpoint
    const enrichmentUrl = env.ENRICHMENT_SERVICE_URL;
    const response = await fetch(
      `${enrichmentUrl}/api/search-finnhub?q=${encodeURIComponent(query)}`
    );

    if (!response.ok) {
      let errorDetail = response.statusText;
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorDetail = errorData.detail;
        }
      } catch {
        // If can't parse JSON, use statusText
      }

      if (response.status === 503) {
        return NextResponse.json(
          { error: "Finnhub service unavailable. FINNHUB_API_KEY may not be configured." },
          { status: 503 }
        );
      }
      if (response.status === 429) {
        return NextResponse.json(
          { error: "Finnhub rate limit exceeded. Please try again later." },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: `Search failed: ${errorDetail}` },
        { status: response.status }
      );
    }

    const data: FinnhubSearchResponse = await response.json();

    // 4. Check which tickers already exist in database
    const tickers = data.results.map((r) => r.symbol.toUpperCase());
    const existingCompanies = await prisma.company.findMany({
      where: { ticker: { in: tickers } },
      select: { ticker: true },
    });

    const existingTickers = new Set(existingCompanies.map((c) => c.ticker));

    // 5. Mark results with existsInDatabase flag
    const resultsWithExists: SearchResultWithExists[] = data.results.map((result) => ({
      ...result,
      existsInDatabase: existingTickers.has(result.symbol.toUpperCase()),
    }));

    return NextResponse.json({
      success: true,
      query: data.query,
      count: data.count,
      results: resultsWithExists,
      timestamp: data.timestamp,
    });
  } catch (error: unknown) {
    console.error("[Company Search] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to search companies";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
