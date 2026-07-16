import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { fetchFinnhubData, normalizeTicker } from "@/shared";

export const maxDuration = 30;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ticker: rawTicker } = await params;
    const ticker = normalizeTicker(rawTicker);

    console.log(`[Finnhub-Live] Fetching live data for ${ticker}...`);
    const finnhubData = await fetchFinnhubData(ticker);

    if (!finnhubData.success) {
      return NextResponse.json(
        { error: "Failed to fetch live data from Finnhub" },
        { status: 500 }
      );
    }

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
