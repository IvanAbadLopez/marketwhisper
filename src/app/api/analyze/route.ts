import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/shared/api/prisma";
import { processAnalysis } from "@/features/analyze-text/api/processAnalysis";
import { checkRateLimit, createErrorResponse } from "@/shared";

export const maxDuration = 60;

const MAX_TEXT_LENGTH = 10000;

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { text, source } = body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `Text exceeds maximum length of ${MAX_TEXT_LENGTH} characters` },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const rateLimitResult = checkRateLimit(`analyze:${user.id}`, {
      max: 10,
      windowMs: 60 * 60 * 1000,
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

    const job = await prisma.job.create({
      data: {
        userId: user.id,
        type: "ANALYSIS",
        status: "PENDING",
        ticker: "PENDING",
      },
    });

    after(() => processAnalysis(job.id, text, source, user.id));

    return NextResponse.json(
      {
        success: true,
        jobId: job.id,
        status: "PENDING",
        message: "Analysis job started. Check status using the jobId.",
      },
      { status: 202 }
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
