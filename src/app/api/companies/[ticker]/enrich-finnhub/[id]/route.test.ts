import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";

// Mock auth module
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

// Mock prisma module
vi.mock("@/shared/api/prisma", () => ({
  prisma: {
    companyEnrichment: {
      findUnique: vi.fn(),
    },
  },
}));

describe("GET /api/companies/[ticker]/enrich-finnhub/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if user is not authenticated", async () => {
    const { auth } = await import("@/lib/auth");
    vi.mocked(auth).mockResolvedValue(null as unknown as Awaited<ReturnType<typeof auth>>);

    const request = new NextRequest("http://localhost:3000/api/companies/AAPL/enrich-finnhub/123");
    const params = Promise.resolve({ ticker: "AAPL", id: "123" });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 404 if enrichment does not exist", async () => {
    const { auth } = await import("@/lib/auth");
    const { prisma } = await import("@/shared/api/prisma");

    vi.mocked(auth).mockResolvedValue({
      user: { id: "user1", email: "test@example.com" },
      expires: "2026-12-31",
    } as unknown as Awaited<ReturnType<typeof auth>>);

    vi.mocked(prisma.companyEnrichment.findUnique).mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/companies/AAPL/enrich-finnhub/123");
    const params = Promise.resolve({ ticker: "AAPL", id: "123" });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Finnhub enrichment not found");
  });

  it("returns 404 if ticker does not match", async () => {
    const { auth } = await import("@/lib/auth");
    const { prisma } = await import("@/shared/api/prisma");

    vi.mocked(auth).mockResolvedValue({
      user: { id: "user1", email: "test@example.com" },
      expires: "2026-12-31",
    } as unknown as Awaited<ReturnType<typeof auth>>);

    const mockEnrichment = {
      id: "123",
      companyId: "company1",
      userId: "user1",
      ticker: "MSFT", // Different ticker
      source: "FINNHUB" as const,
      status: "COMPLETED" as const,
      errorMessage: null,
      financialData: null,
      priceData: null,
      newsHeadlines: null,
      recommendations: null,
      aiAnalysis: "Test analysis",
      aiModel: "llama3.1:8b",
      jobId: "job123",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(prisma.companyEnrichment.findUnique).mockResolvedValue(mockEnrichment);

    const request = new NextRequest("http://localhost:3000/api/companies/AAPL/enrich-finnhub/123");
    const params = Promise.resolve({ ticker: "AAPL", id: "123" });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Finnhub enrichment not found");
  });

  it("returns enrichment status with all fields", async () => {
    const { auth } = await import("@/lib/auth");
    const { prisma } = await import("@/shared/api/prisma");

    vi.mocked(auth).mockResolvedValue({
      user: { id: "user1", email: "test@example.com" },
      expires: "2026-12-31",
    } as unknown as Awaited<ReturnType<typeof auth>>);

    const now = new Date();
    const mockEnrichment = {
      id: "enrichment1",
      companyId: "company1",
      userId: "user1",
      ticker: "AAPL",
      source: "FINNHUB" as const,
      status: "COMPLETED" as const,
      errorMessage: null,
      financialData: { eps: 6.05, peRatio: 28.5 },
      priceData: { fiftyTwoWeekHigh: 199.62, fiftyTwoWeekLow: 164.08 },
      newsHeadlines: null,
      recommendations: null,
      aiAnalysis: "Apple shows strong financial metrics with solid EPS and reasonable P/E ratio.",
      aiModel: "llama3.1:8b",
      jobId: "job123",
      createdAt: now,
      updatedAt: now,
    };

    vi.mocked(prisma.companyEnrichment.findUnique).mockResolvedValue(mockEnrichment);

    const request = new NextRequest("http://localhost:3000/api/companies/AAPL/enrich-finnhub/enrichment1");
    const params = Promise.resolve({ ticker: "AAPL", id: "enrichment1" });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.enrichmentId).toBe("enrichment1");
    expect(data.ticker).toBe("AAPL");
    expect(data.source).toBe("FINNHUB");
    expect(data.status).toBe("COMPLETED");
    expect(data.aiAnalysis).toContain("strong financial metrics");
    expect(data.aiModel).toBe("llama3.1:8b");
    expect(data.updatedAt).toBeDefined();
  });
});
