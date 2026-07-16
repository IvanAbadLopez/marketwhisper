import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/shared/api/prisma";
import { recalculateCompanyAggregatesFromScratch } from "@/features/analyze-text/api/processAnalysis";
import { recomputeCompanyValuation } from "@/entities/company/api/recomputeValuation";
import { createErrorResponse } from "@/shared";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const job = await prisma.job.findUnique({
      where: { id },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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
    return createErrorResponse(
      error,
      'Failed to fetch job status',
      500,
      'Job Status'
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const job = await prisma.job.findUnique({
      where: { id },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (job.status !== "PENDING" && job.status !== "PROCESSING") {
      return NextResponse.json(
        { error: `Job cannot be cancelled (current status: ${job.status})` },
        { status: 400 }
      );
    }

    const updated = await prisma.job.updateMany({
      where: {
        id,
        status: { in: ["PENDING", "PROCESSING"] },
      },
      data: {
        status: "CANCELLED",
        errorMessage: "Cancelled by user",
      },
    });

    if (updated.count === 0) {
      return NextResponse.json(
        { error: "Job status changed before cancellation could complete" },
        { status: 409 }
      );
    }

    if (job.type === "ANALYSIS") {
      const analyses = await prisma.analysis.findMany({
        where: { jobId: id },
        select: { id: true, companyId: true },
      });

      if (analyses.length > 0) {
        const companyIds = [...new Set(analyses.map((a) => a.companyId))];

        await prisma.job.update({
          where: { id },
          data: { analysisId: null },
        });

        await prisma.analysis.deleteMany({
          where: { jobId: id },
        });

        for (const companyId of companyIds) {
          await recalculateCompanyAggregatesFromScratch(companyId);
          await recomputeCompanyValuation(companyId);
        }

        console.log(
          `[Job Cancel] Reverted ${analyses.length} analyses for job ${id}, recalculated ${companyIds.length} companies`
        );
      }
    } else if (job.type === "ENRICHMENT") {
      const enrichments = await prisma.companyEnrichment.findMany({
        where: { jobId: id },
        select: { id: true },
      });

      if (enrichments.length > 0) {
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
    return createErrorResponse(
      error,
      'Failed to cancel job',
      500,
      'Job Cancel'
    );
  }
}
