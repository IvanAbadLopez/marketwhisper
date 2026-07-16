import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/shared/api/prisma";
import { processAnalysis } from "@/features/analyze-text/api/processAnalysis";
import { checkRateLimit, createErrorResponse } from "@/shared";

// Vercel serverless function timeout (60s for Hobby tier)
export const maxDuration = 60;

// Max text length to prevent DoS and prompt injection
const MAX_TEXT_LENGTH = 10000; // 10K chars (~2500 words)

/**
 * POST /api/analyze
 * Kicks off a background text analysis job with AI
 * Returns immediately with jobId for tracking
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { text, source } = body;

    // Validate input
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Cap text length to prevent DoS and prompt injection
    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `Text exceeds maximum length of ${MAX_TEXT_LENGTH} characters` },
        { status: 400 }
      );
    }

    // Get user ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Rate limit analysis requests by user (10 analyses per hour)
    const rateLimitResult = checkRateLimit(`analyze:${user.id}`, {
      max: 10,
      windowMs: 60 * 60 * 1000, // 1 hour
    });

    if (!rateLimitResult.success) {
      const retryAfter = Math.ceil((rateLimitResult.reset - Date.now()) / 1000);
      return NextResponse.json(
        { error: 'Too many analysis requests. Please try again later.' },
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

    // Create a PENDING job record (we don't know the ticker yet, use placeholder)
    const job = await prisma.job.create({
      data: {
        userId: user.id,
        type: "ANALYSIS",
        status: "PENDING",
        ticker: "PENDING", // Will be updated after analysis
      },
    });

    // Kick off the heavy work in the background
    after(() => processAnalysis(job.id, text, source, user.id));

    // Respond immediately
    return NextResponse.json(
      {
        success: true,
        jobId: job.id,
        status: "PENDING",
        message: "Analysis job started. Check status using the jobId.",
      },
      { status: 202 } // 202 Accepted
    );
  } catch (error: unknown) {
    return createErrorResponse(
      error,
      'Failed to start analysis',
      500,
      'Analyze'
    );
  }
}
