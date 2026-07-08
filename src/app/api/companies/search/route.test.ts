/**
 * Test: Company Search API Route
 * @vitest-environment node
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";
import type { Session } from "next-auth";
import type { Company } from "@prisma/client";

// Mock dependencies
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/shared/api/prisma", () => ({
  prisma: {
    company: {
      findMany: vi.fn(),
    },
  },
}));

const mockAuth = vi.mocked(await import("@/lib/auth")).auth;
const mockPrisma = vi.mocked(await import("@/shared/api/prisma")).prisma;

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch as typeof fetch;

describe("GET /api/companies/search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const request = new NextRequest(
      new URL("http://localhost:3000/api/companies/search?q=apple")
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: "Unauthorized" });
  });

  it("should return 400 if query parameter is missing", async () => {
    mockAuth.mockResolvedValue({
      user: { email: "test@example.com" },
    } as Session);

    const request = new NextRequest(
      new URL("http://localhost:3000/api/companies/search")
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("required");
  });

  it("should return search results with existsInDatabase flags", async () => {
    mockAuth.mockResolvedValue({
      user: { email: "test@example.com" },
    } as Session);

    // Mock enrichment service response
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        query: "apple",
        count: 2,
        results: [
          {
            symbol: "AAPL",
            description: "Apple Inc.",
            displaySymbol: "AAPL",
            type: "Common Stock",
          },
          {
            symbol: "APLD",
            description: "Applied Digital Corp",
            displaySymbol: "APLD",
            type: "Common Stock",
          },
        ],
        timestamp: "2026-07-08T10:00:00Z",
      }),
    });

    // Mock database check - AAPL exists, APLD doesn't
    mockPrisma.company.findMany.mockResolvedValue([
      { ticker: "AAPL" } as Pick<Company, "ticker">,
    ]);

    const request = new NextRequest(
      new URL("http://localhost:3000/api/companies/search?q=apple")
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.query).toBe("apple");
    expect(data.count).toBe(2);
    expect(data.results).toHaveLength(2);
    expect(data.results[0].existsInDatabase).toBe(true); // AAPL exists
    expect(data.results[1].existsInDatabase).toBe(false); // APLD doesn't exist
  });

  it("should return 503 if Finnhub service is unavailable", async () => {
    mockAuth.mockResolvedValue({
      user: { email: "test@example.com" },
    } as Session);

    // Mock enrichment service 503 error
    mockFetch.mockResolvedValue({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
      json: async () => ({
        detail: "Finnhub service unavailable. FINNHUB_API_KEY not configured.",
      }),
    } as Response);

    const request = new NextRequest(
      new URL("http://localhost:3000/api/companies/search?q=apple")
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.error).toContain("Finnhub service unavailable");
  });

  it("should return 429 if rate limit is exceeded", async () => {
    mockAuth.mockResolvedValue({
      user: { email: "test@example.com" },
    } as Session);

    // Mock enrichment service 429 error
    mockFetch.mockResolvedValue({
      ok: false,
      status: 429,
      statusText: "Too Many Requests",
      json: async () => ({
        detail: "Finnhub rate limit exceeded.",
      }),
    } as Response);

    const request = new NextRequest(
      new URL("http://localhost:3000/api/companies/search?q=apple")
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toContain("rate limit");
  });
});
