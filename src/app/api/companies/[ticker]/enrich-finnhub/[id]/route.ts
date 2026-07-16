import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string; id: string }> }
) {
  const { prisma } = await import("@/shared/api/prisma");

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ticker, id } = await params;

    const enrichment = await prisma.companyEnrichment.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        ticker: true,
        source: true,
        status: true,
        errorMessage: true,
        aiAnalysis: true,
        aiModel: true,
        updatedAt: true,
      },
    });

    if (!enrichment || enrichment.ticker !== ticker.toUpperCase() || enrichment.source !== "FINNHUB") {
      return NextResponse.json(
        { error: "Finnhub enrichment not found" },
        { status: 404 }
      );
    }

    if (enrichment.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      enrichmentId: enrichment.id,
      ticker: enrichment.ticker,
      source: enrichment.source,
      status: enrichment.status,
      errorMessage: enrichment.errorMessage,
      aiAnalysis: enrichment.aiAnalysis,
      aiModel: enrichment.aiModel,
      updatedAt: enrichment.updatedAt,
    });
  } catch (error: unknown) {
    console.error("[Finnhub Enrich Status] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch Finnhub enrichment status";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
