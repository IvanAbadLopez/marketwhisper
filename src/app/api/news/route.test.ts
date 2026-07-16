/**
 * Test: News API Route
 * @vitest-environment node
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";
import type { Session } from "next-auth";

// Mock dependencies
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/shared", () => ({
  fetchCompanyNews: vi.fn(),
}));

vi.mock("@/shared/api/prisma", () => ({
  prisma: {
    company: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

const mockAuth = vi.mocked(await import("@/lib/auth")).auth;
const mockFetchCompanyNews = vi.mocked(await import("@/shared")).fetchCompanyNews;
const mockPrisma = vi.mocked(await import("@/shared/api/prisma")).prisma;

describe("GET /api/news", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/news");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: "Unauthorized" });
  });

  it("should fetch news for specified ticker", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user1", email: "test@example.com" },
      expires: "2026-12-31",
    } as Session);

    mockPrisma.company.findUnique.mockResolvedValue({
      ticker: "AAPL",
      name: "Apple Inc.",
    } as any);

    const mockNews = [
      {
        title: "Apple announces new product",
        summary: "Apple Inc. announced...",
        publisher: "Bloomberg",
        link: "https://example.com/news1",
        publishedAt: "2026-07-15T10:00:00Z",
        image: null,
      },
    ];

    mockFetchCompanyNews.mockResolvedValue(mockNews);

    const request = new NextRequest("http://localhost:3000/api/news?ticker=AAPL&days=7");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      ticker: "AAPL",
      companyName: "Apple Inc.",
      news: mockNews,
      count: 1,
      days: 7,
    });
    expect(mockFetchCompanyNews).toHaveBeenCalledWith("AAPL", 7);
  });

  it("should use first company if no ticker provided", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user1", email: "test@example.com" },
      expires: "2026-12-31",
    } as Session);

    mockPrisma.company.findFirst.mockResolvedValue({
      ticker: "MSFT",
      name: "Microsoft Corp.",
    } as any);

    mockPrisma.company.findUnique.mockResolvedValue({
      ticker: "MSFT",
      name: "Microsoft Corp.",
    } as any);

    mockFetchCompanyNews.mockResolvedValue([]);

    const request = new NextRequest("http://localhost:3000/api/news");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ticker).toBe("MSFT");
    expect(mockPrisma.company.findFirst).toHaveBeenCalled();
  });

  it("should return 404 if no companies tracked", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user1", email: "test@example.com" },
      expires: "2026-12-31",
    } as Session);

    mockPrisma.company.findFirst.mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/news");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toContain("No companies tracked");
  });

  it("should return 404 if ticker not found in tracked companies", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user1", email: "test@example.com" },
      expires: "2026-12-31",
    } as Session);

    mockPrisma.company.findUnique.mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/news?ticker=INVALID");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toContain("not found");
  });

  it("should validate days parameter", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user1", email: "test@example.com" },
      expires: "2026-12-31",
    } as Session);

    const request = new NextRequest("http://localhost:3000/api/news?ticker=AAPL&days=400");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("between 1 and 365");
  });

  it("should handle rate limit errors", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user1", email: "test@example.com" },
      expires: "2026-12-31",
    } as Session);

    mockPrisma.company.findUnique.mockResolvedValue({
      ticker: "AAPL",
      name: "Apple Inc.",
    } as any);

    mockFetchCompanyNews.mockRejectedValue(new Error("Finnhub rate limit exceeded"));

    const request = new NextRequest("http://localhost:3000/api/news?ticker=AAPL");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toContain("rate limit");
  });

  it("should handle service unavailable errors", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user1", email: "test@example.com" },
      expires: "2026-12-31",
    } as Session);

    mockPrisma.company.findUnique.mockResolvedValue({
      ticker: "AAPL",
      name: "Apple Inc.",
    } as any);

    mockFetchCompanyNews.mockRejectedValue(new Error("News service unavailable"));

    const request = new NextRequest("http://localhost:3000/api/news?ticker=AAPL");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.error).toContain("unavailable");
  });

  it("should handle generic errors", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user1", email: "test@example.com" },
      expires: "2026-12-31",
    } as Session);

    mockPrisma.company.findUnique.mockResolvedValue({
      ticker: "AAPL",
      name: "Apple Inc.",
    } as any);

    mockFetchCompanyNews.mockRejectedValue(new Error("Unknown error"));

    const request = new NextRequest("http://localhost:3000/api/news?ticker=AAPL");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to fetch news");
  });
});

