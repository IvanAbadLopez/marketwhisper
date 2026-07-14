import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/shared";

export async function GET() {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const companies = await prisma.company.findMany({
      include: {
        _count: {
          select: {
            analyses: true,
          },
        },
        analyses: {
          select: {
            id: true,
            sentiment: true,
            reliabilityScore: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 3, // Only latest 3 for summary
        },
      },
      orderBy: {
        ticker: "asc",
      },
    });

    return NextResponse.json(companies);
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 500 }
    );
  }
}
