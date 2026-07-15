/**
 * Job Status Endpoint
 * Returns the current status/result of a background job (analysis or enrichment)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/shared/api/prisma";
import { recalculateCompanyAggregatesFromScratch } from "@/features/analyze-text/api/processAnalysis";
import { recomputeCompanyValuation } from "@/entities/company/api/recomputeValuation";

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

/**
 * PATCH /api/jobs/[id]
 * Cancel a pending or processing job
 * Marks job as CANCELLED and reverts partial data (analyses/enrichments created by this job)
 */
export async function PATCH(
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

    // 5. Check if job can be cancelled (only PENDING or PROCESSING)
    if (job.status !== "PENDING" && job.status !== "PROCESSING") {
      return NextResponse.json(
        { error: `Job cannot be cancelled (current status: ${job.status})` },
        { status: 400 }
      );
    }

    // 6. Mark job as CANCELLED (updateMany to avoid race condition)
    const updated = await prisma.job.updateMany({
      where: {
        id,
        status: { in: ["PENDING", "PROCESSING"] }, // Only if still cancellable
      },
      data: {
        status: "CANCELLED",
        errorMessage: "Cancelled by user",
      },
    });

    if (updated.count === 0) {
      // Job was already completed/failed/cancelled between check and update
      return NextResponse.json(
        { error: "Job status changed before cancellation could complete" },
        { status: 409 }
      );
    }

    // 7. Revert partial data based on job type
    if (job.type === "ANALYSIS") {
      // Delete any analyses created by this job
      const analyses = await prisma.analysis.findMany({
        where: { jobId: id },
        select: { id: true, companyId: true },
      });

      if (analyses.length > 0) {
        // Get unique company IDs
        const companyIds = [...new Set(analyses.map((a) => a.companyId))];

        // Clear the analysisId reference in the job first
        await prisma.job.update({
          where: { id },
          data: { analysisId: null },
        });

        // Delete analyses
        await prisma.analysis.deleteMany({
          where: { jobId: id },
        });

        // Recalculate company aggregates for affected companies
        for (const companyId of companyIds) {
          await recalculateCompanyAggregatesFromScratch(companyId);
          await recomputeCompanyValuation(companyId);
        }

        console.log(
          `[Job Cancel] Reverted ${analyses.length} analyses for job ${id}, recalculated ${companyIds.length} companies`
        );
      }
    } else if (job.type === "ENRICHMENT") {
      // Delete any enrichment created by this job
      const enrichments = await prisma.companyEnrichment.findMany({
        where: { jobId: id },
        select: { id: true },
      });

      if (enrichments.length > 0) {
        // Clear the enrichmentId reference in the job first
        await prisma.job.update({
          where: { id },
          data: { enrichmentId: null },
        });

        await prisma.companyEnrichment.deleteMany({
          where: { jobId: id },
        });

        console.log(`[Job Cancel] Reverted ${enrichments.length} enrichments for job ${id}`);
      }
    }

    return NextResponse.json({
      success: true,
      status: "CANCELLED",
      message: "Job cancelled successfully",
    });
  } catch (error: unknown) {
    console.error("[Job Cancel] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to cancel job";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
