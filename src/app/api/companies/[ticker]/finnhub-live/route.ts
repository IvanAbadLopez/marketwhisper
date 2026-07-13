/**
 * Finnhub Live Data Endpoint
 * Fetches current financial metrics and price data from Finnhub without persisting
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { fetchFinnhubData, normalizeTicker } from "@/shared";

/**
 * GET /api/companies/[ticker]/finnhub-live
 * Returns live financial and price data from Finnhub (read-only, no persistence)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    // 1. Check authentication
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ticker: rawTicker } = await params;
    const ticker = normalizeTicker(rawTicker);

    // 2. Fetch live data from Finnhub (via enrichment service)
    console.log(`[Finnhub-Live] Fetching live data for ${ticker}...`);
    const finnhubData = await fetchFinnhubData(ticker);

    if (!finnhubData.success) {
      return NextResponse.json(
        { error: "Failed to fetch live data from Finnhub" },
        { status: 500 }
      );
    }

    // 3. Return only the financial and price data (no persistence)
    return NextResponse.json({
      success: true,
      ticker,
      financials: finnhubData.financials || null,
      price: finnhubData.price || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("[Finnhub-Live] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch live Finnhub data";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
