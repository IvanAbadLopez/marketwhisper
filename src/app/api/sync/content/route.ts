import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface ScrapedContent {
  title: string;
  description?: string;
  url: string;
  sourceName: string;
  contentType: string;
  publishDate: string;
  tickers?: string[];
  metadata?: any;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get URL and sourceName from request body
    const body = await request.json();
    const { url, sourceName } = body;

    if (!url || !sourceName) {
      return NextResponse.json(
        { error: "Missing required fields: url and sourceName" },
        { status: 400 }
      );
    }

    // Scrape content from URL
    const scrapedContent = await scrapeContent(url, sourceName);

    // Save to database
    const { created, updated } = await saveContentToDatabase(scrapedContent);
    const total = created + updated;

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${total} items (${created} new, ${updated} updated)`,
      count: total,
      created,
      updated,
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      {
        error: "Sync failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Exported for testing
export async function scrapeContent(
  url: string,
  sourceName: string
): Promise<ScrapedContent[]> {
  // TODO: Call Python script with URL parameter
  // For now, return mock data based on URL
  const mockContent: ScrapedContent[] = [
    {
      title: `Content from ${sourceName}`,
      description: `Article scraped from ${url}`,
      url: url,
      sourceName: sourceName,
      contentType: "WEB_ARTICLE",
      publishDate: new Date().toISOString(),
      tickers: ["AAPL", "MSFT"],
      metadata: {
        author: "Unknown",
        tags: ["analysis", "market"],
      },
    },
  ];

  return mockContent;
}

// Exported for testing
export async function saveContentToDatabase(
  contents: ScrapedContent[]
): Promise<{ created: number; updated: number }> {
  let created = 0;
  let updated = 0;

  for (const content of contents) {
    try {
      // Check if content already exists by sourceUrl
      const existing = await prisma.content.findFirst({
        where: { sourceUrl: content.url },
      });

      if (existing) {
        // Update existing content
        await prisma.content.update({
          where: { id: existing.id },
          data: {
            title: content.title,
            description: content.description,
            contentType: content.contentType as any,
            tickers: content.tickers || [],
            date: new Date(content.publishDate),
            sourceName: content.sourceName,
            metadata: content.metadata,
          },
        });
        updated++;
      } else {
        // Create new content
        await prisma.content.create({
          data: {
            title: content.title,
            description: content.description,
            sourceUrl: content.url,
            sourceName: content.sourceName,
            contentType: content.contentType as any,
            tickers: content.tickers || [],
            date: new Date(content.publishDate),
            status: "PENDING",
            metadata: content.metadata,
          },
        });
        created++;
      }
    } catch (error) {
      console.error(`Failed to save/update content: ${content.title}`, error);
    }
  }

  return { created, updated };
}
