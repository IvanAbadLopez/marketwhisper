import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";

// Mock auth module
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

// Mock fetchFinnhubData
vi.mock("@/features/enrich-company/api/processEnrichment", () => ({
  fetchFinnhubData: vi.fn(),
  normalizeTicker: (ticker: string) => ticker.replace(/^\$/, '').trim().toUpperCase(),
}));

describe("GET /api/companies/[ticker]/finnhub-live", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if user is not authenticated", async () => {
    const { auth } = await import("@/lib/auth");
    vi.mocked(auth).mockResolvedValue(null as unknown as Awaited<ReturnType<typeof auth>>);

    const request = new NextRequest("http://localhost:3000/api/companies/AAPL/finnhub-live");
    const params = Promise.resolve({ ticker: "AAPL" });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns live financial and price data from Finnhub", async () => {
    const { auth } = await import("@/lib/auth");
    const { fetchFinnhubData } = await import("@/features/enrich-company/api/processEnrichment");

    vi.mocked(auth).mockResolvedValue({
      user: { id: "user1", email: "test@example.com" },
      expires: "2026-12-31",
    } as unknown as Awaited<ReturnType<typeof auth>>);

    const mockFinnhubData = {
      success: true,
      ticker: "AAPL",
      companyInfo: {
        ticker: "AAPL",
        name: "Apple Inc.",
        sector: "Technology",
        industry: "Consumer Electronics",
        description: null,
        website: "https://apple.com",
        employees: null,
        marketCap: 3000000000000,
      },
      financials: {
        revenue: null,
        netIncome: null,
        eps: 6.05,
        peRatio: 28.5,
        debtToEquity: null,
        dividendYield: 0.005,
        profitMargins: 0.25,
      },
      price: {
        currentPrice: null,
        previousClose: null,
        dayChange: null,
        dayChangePercent: null,
        fiftyTwoWeekHigh: 199.62,
        fiftyTwoWeekLow: 164.08,
        volume: null,
        avgVolume: null,
      },
    };

    vi.mocked(fetchFinnhubData).mockResolvedValue(mockFinnhubData);

    const request = new NextRequest("http://localhost:3000/api/companies/AAPL/finnhub-live");
    const params = Promise.resolve({ ticker: "AAPL" });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.ticker).toBe("AAPL");
    expect(data.financials).toEqual(mockFinnhubData.financials);
    expect(data.price).toEqual(mockFinnhubData.price);
    expect(data.timestamp).toBeDefined();
  });

  it("returns 500 if Finnhub fetch fails", async () => {
    const { auth } = await import("@/lib/auth");
    const { fetchFinnhubData } = await import("@/features/enrich-company/api/processEnrichment");

    vi.mocked(auth).mockResolvedValue({
      user: { id: "user1", email: "test@example.com" },
      expires: "2026-12-31",
    } as unknown as Awaited<ReturnType<typeof auth>>);

    vi.mocked(fetchFinnhubData).mockRejectedValue(new Error("Finnhub rate limit exceeded"));

    const request = new NextRequest("http://localhost:3000/api/companies/AAPL/finnhub-live");
    const params = Promise.resolve({ ticker: "AAPL" });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain("Finnhub rate limit exceeded");
  });
});
