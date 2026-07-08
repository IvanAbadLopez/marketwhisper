/**
 * Job Status Endpoint
 * Returns the current status/result of a background job (analysis or enrichment)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/shared";

/**
 * GET /api/jobs/[id]
 * Poll the status of a background job
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Check authentication
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // 2. Get user ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 3. Look up the job record
    const job = await prisma.job.findUnique({
      where: { id },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // 4. Verify ownership
    if (job.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 5. Return the current status and result
    return NextResponse.json({
      jobId: job.id,
      type: job.type,
      ticker: job.ticker,
      status: job.status,
      errorMessage: job.errorMessage,
      result: job.result,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    });
  } catch (error: unknown) {
    console.error("[Job Status] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch job status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
