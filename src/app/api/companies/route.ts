import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
            content: true,
            mentions: true,
          },
        },
        content: {
          include: {
            content: {
              select: {
                id: true,
                title: true,
                contentType: true,
                date: true,
                status: true,
              },
            },
          },
          orderBy: {
            content: {
              date: "desc",
            },
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
