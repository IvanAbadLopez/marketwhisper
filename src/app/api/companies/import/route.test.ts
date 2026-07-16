/**
 * Test: Company Import API Route
 * @vitest-environment node
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";
import type { Session } from "next-auth";
import type { Company, CompanyEnrichment } from "@prisma/client";

// Mock dependencies
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
      create: vi.fn(),
    },
    companyEnrichment: {
      create: vi.fn(),
    },
    job: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/shared", () => ({
  fetchFinnhubData: vi.fn(),
  normalizeTicker: (ticker: string) => ticker.toUpperCase().trim(),
}));

vi.mock("@/features/enrich-company/api/processEnrichment", () => ({
  processEnrichment: vi.fn(),
}));

// Mock Next.js after() for background tasks
vi.mock("next/server", async () => {
  const actual = await vi.importActual("next/server");
  return {
    ...actual,
    after: () => {
      // Don't actually run the background task in tests
      return;
    },
  };
});

const mockAuth = vi.mocked(await import("@/lib/auth")).auth;
const mockPrisma = vi.mocked(await import("@/shared/api/prisma")).prisma;
const mockFetchFinnhubData = vi.mocked(await import("@/shared")).fetchFinnhubData;

describe("POST /api/companies/import", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/companies/import", {
      method: "POST",
      body: JSON.stringify({ ticker: "AAPL" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: "Unauthorized" });
  });

  it("should return 400 if ticker is missing", async () => {
    mockAuth.mockResolvedValue({
      user: { email: "test@example.com" },
    } as Session);

    const request = new NextRequest("http://localhost:3000/api/companies/import", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Ticker is required");
  });

  it("should return existing company if already imported", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user1", email: "test@example.com" },
    } as Session);

    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user1",
      email: "test@example.com",
    } as any);

    mockPrisma.company.findFirst.mockResolvedValue({
      id: "company-123",
      ticker: "AAPL",
      name: "Apple Inc.",
    } as Company);

    const request = new NextRequest("http://localhost:3000/api/companies/import", {
      method: "POST",
      body: JSON.stringify({ ticker: "AAPL" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.ticker).toBe("AAPL");
    expect(data.companyId).toBe("company-123");
    expect(data.alreadyExists).toBe(true);
  });

  it("should create new company and start enrichment", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user1", email: "test@example.com" },
    } as Session);

    // Mock user lookup
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user1",
      email: "test@example.com",
    } as any);

    // Company doesn't exist
    mockPrisma.company.findFirst.mockResolvedValue(null);

    // Mock Finnhub data fetch
    mockFetchFinnhubData.mockResolvedValue({
      success: true,
      ticker: "TSLA",
      companyInfo: {
        ticker: "TSLA",
        name: "Tesla Inc.",
        sector: "Technology",
        industry: "Auto Manufacturers",
        website: "https://tesla.com",
        marketCap: 800000000000,
        description: null,
        employees: null,
      },
      financials: undefined,
      price: undefined,
    });

    // Mock company creation
    mockPrisma.company.create.mockResolvedValue({
      id: "company-456",
      ticker: "TSLA",
      name: "Tesla Inc.",
    } as Company);

    // Mock job creation
    mockPrisma.job.create.mockResolvedValue({
      id: "job-123",
      userId: "user1",
      type: "ENRICHMENT",
      status: "PENDING",
      ticker: "TSLA",
      result: null,
      errorMessage: null,
      analysisId: null,
      enrichmentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    // Mock enrichment creation
    mockPrisma.companyEnrichment.create.mockResolvedValue({
      id: "enrichment-789",
      companyId: "company-456",
      ticker: "TSLA",
      source: "FINNHUB",
      status: "PENDING",
      jobId: "job-123",
    } as CompanyEnrichment);

    const request = new NextRequest("http://localhost:3000/api/companies/import", {
      method: "POST",
      body: JSON.stringify({ ticker: "TSLA" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.ticker).toBe("TSLA");
    expect(data.companyId).toBe("company-456");
    expect(data.enrichmentId).toBe("enrichment-789");
    expect(data.alreadyExists).toBe(false);
    expect(mockPrisma.company.create).toHaveBeenCalled();
    expect(mockPrisma.companyEnrichment.create).toHaveBeenCalled();
  });

  it("should return 404 if ticker not found in Finnhub", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user1", email: "test@example.com" },
    } as Session);

    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user1",
      email: "test@example.com",
    } as any);

    mockPrisma.company.findFirst.mockResolvedValue(null);

    // Mock Finnhub fetch error
    mockFetchFinnhubData.mockRejectedValue(
      new Error("Ticker XYZ not found in Finnhub")
    );

    const request = new NextRequest("http://localhost:3000/api/companies/import", {
      method: "POST",
      body: JSON.stringify({ ticker: "XYZ" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toContain("not found");
  });
});
