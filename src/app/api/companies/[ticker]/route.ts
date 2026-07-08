import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/shared";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ticker } = await params;

  try {
    const company = await prisma.company.findUnique({
      where: {
        ticker: ticker.toUpperCase(),
      },
      include: {
        _count: {
          select: {
            content: true,
            mentions: true,
            analyses: true,
          },
        },
        content: {
          include: {
            content: {
              include: {
                transcripts: true,
                mentions: {
                  orderBy: {
                    timestamp: "asc",
                  },
                },
              },
            },
          },
          orderBy: {
            content: {
              date: "desc",
            },
          },
        },
        mentions: {
          include: {
            content: {
              select: {
                id: true,
                title: true,
                contentType: true,
                date: true,
              },
            },
          },
          orderBy: {
            timestamp: "asc",
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
          take: 10, // Get latest enrichments
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
