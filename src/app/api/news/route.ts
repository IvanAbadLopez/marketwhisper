import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { fetchCompanyNews } from "@/shared";
import { prisma } from "@/shared/api/prisma";

export const maxDuration = 30;

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get("ticker");
    const daysParam = searchParams.get("days");
    const days = daysParam ? parseInt(daysParam, 10) : 7;

    if (days < 1 || days > 365) {
      return NextResponse.json(
        { error: "Days parameter must be between 1 and 365" },
        { status: 400 }
      );
    }

    let targetTicker = ticker;

    if (!targetTicker) {
      const firstCompany = await prisma.company.findFirst({
        where: { userId: session.user.id },
        orderBy: { ticker: "asc" },
        select: { ticker: true },
      });

      if (!firstCompany) {
        return NextResponse.json(
          { error: "No companies tracked. Add a company first." },
          { status: 404 }
        );
      }

      targetTicker = firstCompany.ticker;
    }

    const company = await prisma.company.findFirst({
      where: {
        userId: session.user.id,
        ticker: targetTicker.toUpperCase(),
      },
      select: { ticker: true, name: true },
    });

    if (!company) {
      return NextResponse.json(
        { error: `Company with ticker ${targetTicker} not found in your tracked companies.` },
        { status: 404 }
      );
    }

    const news = await fetchCompanyNews(company.ticker, days);

    return NextResponse.json({
      success: true,
      ticker: company.ticker,
      companyName: company.name,
      news,
      count: news.length,
      days,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching news:", message);

    if (message.includes("rate limit")) {
      return NextResponse.json(
        { error: "Finnhub rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    if (message.includes("service unavailable")) {
      return NextResponse.json(
        { error: "News service temporarily unavailable." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch news" },
      { status: 500 }
    );
  }
}
