/**
 * On-demand Translation Endpoint for Finnhub Enrichment AI Analysis
 * Translates aiAnalysis to Spanish and caches result in aiAnalysisEs
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { translateToSpanish } from "@/shared/api/translate";

/**
 * POST /api/companies/[ticker]/enrich-finnhub/[id]/translate
 * Translate the AI analysis to Spanish on-demand
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string; id: string }> }
) {
  const { prisma } = await import("@/shared/api/prisma");

  try {
    // 1. Check authentication
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ticker, id } = await params;
    const normalizedTicker = ticker.toUpperCase();

    // 2. Look up the enrichment record
    const enrichment = await prisma.companyEnrichment.findUnique({
      where: { id },
      select: {
        id: true,
        ticker: true,
        source: true,
        aiAnalysis: true,
        aiAnalysisEs: true,
      },
    });

    if (!enrichment || enrichment.ticker !== normalizedTicker || enrichment.source !== "FINNHUB") {
      return NextResponse.json(
        { error: "Finnhub enrichment not found" },
        { status: 404 }
      );
    }

    // 3. Check if translation already exists (cache hit)
    if (enrichment.aiAnalysisEs) {
      return NextResponse.json({
        aiAnalysisEs: enrichment.aiAnalysisEs,
        cached: true,
      });
    }

    // 4. Validate that aiAnalysis exists
    if (!enrichment.aiAnalysis) {
      return NextResponse.json(
        { error: "No AI analysis available to translate" },
        { status: 400 }
      );
    }

    // 5. Translate to Spanish
    console.log(`[Translate:${id}] Translating AI analysis for ${normalizedTicker}...`);
    const aiAnalysisEs = await translateToSpanish(enrichment.aiAnalysis);

    // 6. Persist translation in database
    await prisma.companyEnrichment.update({
      where: { id },
      data: { aiAnalysisEs },
    });

    console.log(`[Translate:${id}] Successfully translated and cached for ${normalizedTicker}`);

    // 7. Return translation
    return NextResponse.json({
      aiAnalysisEs,
      cached: false,
    });
  } catch (error: unknown) {
    console.error("[Translate] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to translate analysis";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
