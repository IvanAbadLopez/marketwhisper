import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface SituationResult {
  title: string;
  url: string;
  type: string;
  publishDate: string;
  summary: string;
  tickers?: string[];
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get situations (mock data for now, will call Python script later)
    const situations = await getSituations();

    // Save to database
    const { created, updated } = await saveSituationsToDatabase(situations);
    const total = created + updated;

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${total} special situations (${created} new, ${updated} updated)`,
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
export async function getSituations(): Promise<SituationResult[]> {
  // TODO: Call Python script with spawn
  // For now, return mock data
  const mockSituations: SituationResult[] = [
    {
      title: "Company ABC Merger Announcement",
      url: "https://example.com/situations/abc-merger",
      type: "MERGER",
      publishDate: new Date().toISOString(),
      summary: "Company ABC announces merger with XYZ Corp at $50 per share",
      tickers: ["ABC", "XYZ"],
    },
    {
      title: "DEF Corp Spinoff Details",
      url: "https://example.com/situations/def-spinoff",
      type: "SPINOFF",
      publishDate: new Date().toISOString(),
      summary: "DEF Corp to spin off subsidiary as independent company",
      tickers: ["DEF"],
    },
  ];

  return mockSituations;
}

// Exported for testing
export async function saveSituationsToDatabase(
  situations: SituationResult[]
): Promise<{ created: number; updated: number }> {
  let created = 0;
  let updated = 0;

  for (const situation of situations) {
    try {
      // Check if situation already exists by URL
      const existing = await prisma.specialSituation.findFirst({
        where: { sourceUrl: situation.url },
      });

      if (existing) {
        // Update existing situation
        await prisma.specialSituation.update({
          where: { id: existing.id },
          data: {
            title: situation.title,
            description: situation.summary,
            type: situation.type as any,
            tickers: situation.tickers || [],
            date: new Date(situation.publishDate),
            // Keep existing status, don't overwrite
          },
        });
        updated++;
      } else {
        // Create new situation
        await prisma.specialSituation.create({
          data: {
            title: situation.title,
            description: situation.summary,
            sourceUrl: situation.url,
            type: situation.type as any,
            tickers: situation.tickers || [],
            date: new Date(situation.publishDate),
            status: "NEW",
          },
        });
        created++;
      }
    } catch (error) {
      console.error(`Failed to save/update situation: ${situation.title}`, error);
    }
  }

  return { created, updated };
}

