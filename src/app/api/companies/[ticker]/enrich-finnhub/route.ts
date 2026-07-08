/**
 * Enrich Company with Finnhub API Endpoint
 * Fetches public financial data from Finnhub and generates AI analysis with Ollama
 */

import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { auth } from "@/lib/auth";
import { processEnrichment } from "@/features/enrich-company/api/processEnrichment";

/**
 * POST /api/companies/[ticker]/enrich-finnhub
 * Kicks off a background Finnhub enrichment job
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { prisma } = await import("@/shared/api/prisma");

  try {
    // 1. Check authentication
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ticker } = await params;

    // 2. Get user ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 3. Find company in database
    const company = await prisma.company.findUnique({
      where: { ticker: ticker.toUpperCase() },
    });

    if (!company) {
      return NextResponse.json(
        { error: `Company with ticker ${ticker} not found in database` },
        { status: 404 }
      );
    }

    // 4. Create a Job record for tracking in the queue
    const job = await prisma.job.create({
      data: {
        userId: user.id,
        type: "ENRICHMENT",
        status: "PENDING",
        ticker: ticker.toUpperCase(),
      },
    });

    // 5. Create a PENDING enrichment record with source=FINNHUB
    const enrichment = await prisma.companyEnrichment.create({
      data: {
        companyId: company.id,
        ticker: ticker.toUpperCase(),
        source: "FINNHUB",
        status: "PENDING",
        jobId: job.id, // Link to job for tracking
      },
    });

    // 6. Kick off the heavy work in the background
    after(() => processEnrichment(enrichment.id, company.id, ticker, job.id));

    // 7. Respond immediately
    return NextResponse.json(
      {
        success: true,
        ticker: ticker.toUpperCase(),
        enrichmentId: enrichment.id,
        jobId: job.id,
        status: "PENDING",
        source: "FINNHUB",
      },
      { status: 202 }
    );
  } catch (error: unknown) {
    console.error("[Enrich-Finnhub] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to enrich company with Finnhub";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
