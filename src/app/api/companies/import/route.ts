/**
 * Company Import API - creates company from Finnhub and starts enrichment
 * POST /api/companies/import
 * Body: { ticker: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { auth } from "@/lib/auth";
import { processEnrichment } from "@/features/enrich-company/api/processEnrichment";
import { fetchFinnhubData, normalizeTicker, checkRateLimit } from "@/shared";

// Vercel serverless function timeout (60s for Hobby tier)
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const { prisma } = await import("@/shared/api/prisma");

  try {
    // 1. Check authentication
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit import requests by user (20 imports per hour)
    const rateLimitResult = checkRateLimit(`import:${session.user.id}`, {
      max: 20,
      windowMs: 60 * 60 * 1000, // 1 hour
    });

    if (!rateLimitResult.success) {
      const retryAfter = Math.ceil((rateLimitResult.reset - Date.now()) / 1000);
      return NextResponse.json(
        { error: 'Too many import requests. Please try again later.' },
        { 
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
          },
        }
      );
    }

    // 2. Parse request body
    const body = await request.json();
    const { ticker: rawTicker } = body;

    if (!rawTicker || typeof rawTicker !== "string") {
      return NextResponse.json(
        { error: "Ticker is required and must be a string" },
        { status: 400 }
      );
    }

    const ticker = normalizeTicker(rawTicker);

    // 3. Check if company already exists for this user
    const existingCompany = await prisma.company.findFirst({
      where: {
        userId: session.user.id as string,
        ticker,
      },
    });

    if (existingCompany) {
      return NextResponse.json(
        {
          success: true,
          ticker,
          companyId: existingCompany.id,
          alreadyExists: true,
          message: `Company ${ticker} already exists in database`,
        },
        { status: 200 }
      );
    }

    // 4. Fetch profile from Finnhub to populate basic company data
    console.log(`[Import] Fetching Finnhub profile for ${ticker}...`);
    let finnhubData;
    try {
      finnhubData = await fetchFinnhubData(ticker);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch company data";
      return NextResponse.json(
        { error: `Cannot import ${ticker}: ${message}` },
        { status: 404 }
      );
    }

    if (!finnhubData.companyInfo) {
      return NextResponse.json(
        { error: `No company information found for ticker ${ticker}` },
        { status: 404 }
      );
    }

    const { name, sector, industry, website, marketCap } = finnhubData.companyInfo;

    // 5. Create company in database
    const company = await prisma.company.create({
      data: {
        userId: session.user.id as string,
        ticker,
        name: name || ticker,
        sector: sector || null,
        industry: industry || null,
        website: website || null,
        marketCap: marketCap || null,
        description: null,
        logoUrl: null,
      },
    });

    console.log(`[Import] Created company ${ticker} (ID: ${company.id})`);

    // 6. Create a Job record for tracking in the queue
    const job = await prisma.job.create({
      data: {
        userId: session.user.id as string,
        type: "ENRICHMENT",
        status: "PENDING",
        ticker,
      },
    });

    // 7. Create a PENDING enrichment record
    const enrichment = await prisma.companyEnrichment.create({
      data: {
        userId: session.user.id as string,
        companyId: company.id,
        ticker,
        source: "FINNHUB",
        status: "PENDING",
        jobId: job.id, // Link to job for tracking
      },
    });

    // 8. Kick off background enrichment (full analysis with AI)
    after(() => processEnrichment(enrichment.id, company.id, ticker, job.id, session.user.id as string));

    console.log(
      `[Import] Started enrichment for ${ticker} (Enrichment ID: ${enrichment.id}, Job ID: ${job.id})`
    );

    // 10. Respond immediately
    return NextResponse.json(
      {
        success: true,
        ticker,
        companyId: company.id,
        enrichmentId: enrichment.id,
        jobId: job.id,
        alreadyExists: false,
        message: `Company ${ticker} imported successfully. Enrichment in progress.`,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("[Import] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to import company";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
