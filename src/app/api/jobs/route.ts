import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/shared/api/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get("type") as "ANALYSIS" | "ENRICHMENT" | null;
    const statusParam = searchParams.get("status");

    const where: Record<string, unknown> = {
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
