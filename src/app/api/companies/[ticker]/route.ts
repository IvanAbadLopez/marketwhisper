import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/shared/api/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ticker } = await params;

  try {
    const company = await prisma.company.findFirst({
      where: {
        userId: session.user.id,
        ticker: ticker.toUpperCase(),
      },
      include: {
        _count: {
          select: {
            analyses: true,
            enrichments: true,
          },
        },
        analyses: {
          orderBy: {
            createdAt: "desc",
          },
        },
        enrichments: {
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
        },
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error("Error fetching company:", error);
    return NextResponse.json(
      { error: "Failed to fetch company" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ticker } = await params;
  const upperTicker = ticker.toUpperCase();

  try {
    const company = await prisma.company.findFirst({
      where: {
        userId: session.user.id,
        ticker: upperTicker,
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    await prisma.job.deleteMany({
      where: {
        userId: session.user.id,
        ticker: upperTicker,
      },
    });

    await prisma.company.delete({
      where: { id: company.id },
    });

    return NextResponse.json({
      message: "Company deleted successfully",
      ticker: upperTicker,
    });
  } catch (error) {
    console.error("Error deleting company:", error);
    return NextResponse.json(
      { error: "Failed to delete company" },
      { status: 500 }
    );
  }
}
