/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/shared/api/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    company: {
      findFirst: vi.fn(),
    },
    job: {
      create: vi.fn(),
    },
    companyEnrichment: {
      create: vi.fn(),
    },
  },
}));

vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();
  return {
    ...actual,
    after: vi.fn(() => {
    }),
  };
});

describe("POST /api/companies/[ticker]/enrich-finnhub", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if user is not authenticated", async () => {
    const { auth } = await import("@/lib/auth");
    vi.mocked(auth).mockResolvedValue(null as unknown as Awaited<ReturnType<typeof auth>>);

    const request = new NextRequest("http://localhost:3000/api/companies/AAPL/enrich-finnhub", {
      method: "POST",
    });
    const params = Promise.resolve({ ticker: "AAPL" });

    const response = await POST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 404 if company does not exist", async () => {
    const { auth } = await import("@/lib/auth");
    const { prisma } = await import("@/shared/api/prisma");

    vi.mocked(auth).mockResolvedValue({
      user: { id: "user1", email: "test@example.com" },
      expires: "2026-12-31",
    } as unknown as Awaited<ReturnType<typeof auth>>);

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user1",
      email: "test@example.com",
    } as any);

    vi.mocked(prisma.company.findFirst).mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/companies/INVALID/enrich-finnhub", {
      method: "POST",
    });
    const params = Promise.resolve({ ticker: "INVALID" });

    const response = await POST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toContain("Company with ticker INVALID not found");
  });

  it("creates enrichment record and returns 202 for valid request", async () => {
    const { auth } = await import("@/lib/auth");
    const { prisma } = await import("@/shared/api/prisma");

    vi.mocked(auth).mockResolvedValue({
      user: { id: "user1", email: "test@example.com" },
      expires: "2026-12-31",
    } as unknown as Awaited<ReturnType<typeof auth>>);

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user1",
      email: "test@example.com",
    } as any);

    const mockCompany = {
      id: "company1",
      userId: "user1",
      ticker: "AAPL",
      name: "Apple Inc.",
      description: "Technology company",
      sector: "Technology",
      industry: "Consumer Electronics",
      marketCap: 3000000000000,
      logoUrl: null,
      website: "https://apple.com",
      avgSentimentScore: null,
      avgReliabilityScore: null,
      analysisCount: 0,
      globalScore: null,
      targetPrice: null,
      valuationUpdatedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockEnrichment = {
      id: "enrichment1",
      userId: "user1",
      companyId: "company1",
      ticker: "AAPL",
      source: "FINNHUB" as const,
      status: "PENDING" as const,
      errorMessage: null,
      financialData: null,
      priceData: null,
      newsHeadlines: null,
      recommendations: null,
      aiAnalysis: null,
      aiModel: null,
      jobId: "job123",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(prisma.company.findFirst).mockResolvedValue(mockCompany);
    
    vi.mocked(prisma.job.create).mockResolvedValue({
      id: "job123",
      userId: "user1",
      type: "ENRICHMENT",
      status: "PENDING",
      ticker: "AAPL",
      result: null,
      errorMessage: null,
      analysisId: null,
      enrichmentId: "enrichment1",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    
    vi.mocked(prisma.companyEnrichment.create).mockResolvedValue(mockEnrichment);

    const request = new NextRequest("http://localhost:3000/api/companies/AAPL/enrich-finnhub", {
      method: "POST",
    });
    const params = Promise.resolve({ ticker: "AAPL" });

    const response = await POST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(202);
    expect(data.success).toBe(true);
    expect(data.ticker).toBe("AAPL");
    expect(data.enrichmentId).toBe("enrichment1");
    expect(data.status).toBe("PENDING");
    expect(data.source).toBe("FINNHUB");

    expect(prisma.job.create).toHaveBeenCalledWith({
      data: {
        userId: "user1",
        type: "ENRICHMENT",
        status: "PENDING",
        ticker: "AAPL",
      },
    });
    
    expect(prisma.companyEnrichment.create).toHaveBeenCalledWith({
      data: {
        userId: "user1",
        companyId: "company1",
        ticker: "AAPL",
        source: "FINNHUB",
        status: "PENDING",
        jobId: "job123",
      },
    });
  });
});
