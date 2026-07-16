import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { auth } from "@/lib/auth";
import { processEnrichment } from "@/features/enrich-company/api/processEnrichment";

export const maxDuration = 60;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { prisma } = await import("@/shared/api/prisma");

  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ticker } = await params;

    const company = await prisma.company.findFirst({
      where: {
        userId: session.user.id as string,
        ticker: ticker.toUpperCase(),
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: `Company with ticker ${ticker} not found in database` },
        { status: 404 }
      );
    }

    const job = await prisma.job.create({
      data: {
        userId: session.user.id as string,
        type: "ENRICHMENT",
        status: "PENDING",
        ticker: ticker.toUpperCase(),
      },
    });

    const enrichment = await prisma.companyEnrichment.create({
      data: {
        userId: session.user.id as string,
        companyId: company.id,
        ticker: ticker.toUpperCase(),
        source: "FINNHUB",
        status: "PENDING",
        jobId: job.id,
      },
    });

    after(() => processEnrichment(enrichment.id, company.id, ticker, job.id, session.user.id as string));

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
