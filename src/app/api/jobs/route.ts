/**
 * Jobs List Endpoint
 * Returns all jobs for the authenticated user
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/shared";

/**
 * GET /api/jobs
 * List all jobs for the current user with optional filters
 * Query params:
 *   - type: ANALYSIS | ENRICHMENT (optional)
 *   - status: PENDING | PROCESSING | COMPLETED | FAILED (optional, comma-separated)
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Check authentication
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get user ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 3. Parse query parameters
    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get("type") as "ANALYSIS" | "ENRICHMENT" | null;
    const statusParam = searchParams.get("status");

    // Build where clause
    const where: any = {
      userId: user.id,
    };

    if (typeFilter) {
      where.type = typeFilter;
    }

    if (statusParam) {
      const statuses = statusParam.split(",");
      where.status = {
        in: statuses,
      };
    }

    // 4. Fetch jobs ordered by creation date (newest first)
    const jobs = await prisma.job.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        type: true,
        status: true,
        ticker: true,
        result: true,
        errorMessage: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // 5. Return jobs
    return NextResponse.json({
      success: true,
      count: jobs.length,
      jobs,
    });
  } catch (error: unknown) {
    console.error("[Jobs List] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch jobs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
