import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/shared/api/prisma";
import { recalculateCompanyAggregatesFromScratch } from "@/features/analyze-text/api/processAnalysis";
import { recomputeCompanyValuation } from "@/entities/company/api/recomputeValuation";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Analysis ID is required" }, { status: 400 });
  }

  try {
    const analysis = await prisma.analysis.findUnique({
      where: { id },
      select: {
        userId: true,
        companyId: true,
        ticker: true,
      },
    });

    if (!analysis) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
    }

    if (analysis.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.analysis.delete({
      where: { id },
    });

    await recalculateCompanyAggregatesFromScratch(analysis.companyId);

    await recomputeCompanyValuation(analysis.companyId);

    return NextResponse.json({ 
      success: true,
      message: "Analysis deleted and company metrics recomputed"
    }, { status: 200 });
  } catch (error) {
    console.error("Error deleting analysis:", error);
    return NextResponse.json(
      { error: "Failed to delete analysis" },
      { status: 500 }
    );
  }
}
