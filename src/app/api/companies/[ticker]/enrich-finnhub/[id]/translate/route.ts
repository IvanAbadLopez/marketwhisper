/**
 * On-demand Translation Endpoint for Finnhub Enrichment AI Analysis
 * Translates AI analysis from English to Spanish using Ollama
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { translateToSpanish } from "@/shared/api/translate";

/**
 * POST /api/companies/[ticker]/enrich-finnhub/[id]/translate
 * Translates the AI analysis to Spanish
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
      },
    });

    if (!enrichment || enrichment.ticker !== normalizedTicker || enrichment.source !== "FINNHUB") {
      return NextResponse.json(
        { error: "Finnhub enrichment not found" },
        { status: 404 }
      );
    }

    if (!enrichment.aiAnalysis) {
      return NextResponse.json(
        { error: "No AI analysis available to translate" },
        { status: 404 }
      );
    }

    // 3. Translate to Spanish using Ollama
    const translation = await translateToSpanish(enrichment.aiAnalysis);

    return NextResponse.json({
      translation,
    });
  } catch (error: unknown) {
    console.error("[Translate] Error:", error);
    const message = error instanceof Error ? error.message : "Translation failed";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
