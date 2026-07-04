/**
 * Enrichment Status Endpoint
 * Returns the current status/result of a background enrichment job.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * GET /api/companies/[ticker]/enrich/[id]
 * Poll the status of a background enrichment job.
 */
export async function GET(
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

    // 2. Look up the enrichment record
    const enrichment = await prisma.companyEnrichment.findUnique({
      where: { id },
    });

    if (!enrichment || enrichment.ticker !== ticker.toUpperCase()) {
      return NextResponse.json(
        { error: "Enrichment not found" },
        { status: 404 }
      );
    }

    // 3. Return the current status and result (if completed)
    return NextResponse.json({
      enrichmentId: enrichment.id,
      ticker: enrichment.ticker,
      status: enrichment.status,
      errorMessage: enrichment.errorMessage,
      aiAnalysis: enrichment.aiAnalysis,
      financials: enrichment.financialData,
      price: enrichment.priceData,
      news: enrichment.newsHeadlines,
      recommendations: enrichment.recommendations,
      ollamaModel: enrichment.ollamaModel,
      updatedAt: enrichment.updatedAt,
    });
  } catch (error: any) {
    console.error("[Enrich Status] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch enrichment status" },
      { status: 500 }
    );
  }
}
