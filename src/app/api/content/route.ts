import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const allContent = await prisma.content.findMany({
      orderBy: {
        date: "desc",
      },
      include: {
        companies: {
          include: {
            company: true,
          },
        },
      },
    });

    return NextResponse.json(allContent, { status: 200 });
  } catch (error) {
    console.error("Error fetching content:", error);
    return NextResponse.json(
      { error: "Failed to fetch content" },
      { status: 500 }
    );
  }
}
