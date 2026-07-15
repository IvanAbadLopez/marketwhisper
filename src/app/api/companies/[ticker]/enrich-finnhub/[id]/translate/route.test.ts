import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
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

// Mock translate module
vi.mock("@/shared/api/translate", () => ({
  translateToSpanish: vi.fn(),
}));

describe("POST /api/companies/[ticker]/enrich-finnhub/[id]/translate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if user is not authenticated", async () => {
    const { auth } = await import("@/lib/auth");
    vi.mocked(auth).mockResolvedValue(null as unknown as Awaited<ReturnType<typeof auth>>);

    const request = new NextRequest("http://localhost:3000/api/companies/AAPL/enrich-finnhub/123/translate", {
      method: "POST",
    });
    const params = Promise.resolve({ ticker: "AAPL", id: "123" });

    const response = await POST(request, { params });
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

    const request = new NextRequest("http://localhost:3000/api/companies/AAPL/enrich-finnhub/123/translate", {
      method: "POST",
    });
    const params = Promise.resolve({ ticker: "AAPL", id: "123" });

    const response = await POST(request, { params });
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
      ticker: "MSFT", // Different ticker
      source: "FINNHUB" as const,
      aiAnalysis: "Test analysis",
    };

    vi.mocked(prisma.companyEnrichment.findUnique).mockResolvedValue(mockEnrichment);

    const request = new NextRequest("http://localhost:3000/api/companies/AAPL/enrich-finnhub/123/translate", {
      method: "POST",
    });
    const params = Promise.resolve({ ticker: "AAPL", id: "123" });

    const response = await POST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Finnhub enrichment not found");
  });

  it("returns 404 if source is not FINNHUB", async () => {
    const { auth } = await import("@/lib/auth");
    const { prisma } = await import("@/shared/api/prisma");

    vi.mocked(auth).mockResolvedValue({
      user: { id: "user1", email: "test@example.com" },
      expires: "2026-12-31",
    } as unknown as Awaited<ReturnType<typeof auth>>);

    const mockEnrichment = {
      id: "123",
      ticker: "AAPL",
      source: "OTHER" as const,
      aiAnalysis: "Test analysis",
    };

    vi.mocked(prisma.companyEnrichment.findUnique).mockResolvedValue(mockEnrichment);

    const request = new NextRequest("http://localhost:3000/api/companies/AAPL/enrich-finnhub/123/translate", {
      method: "POST",
    });
    const params = Promise.resolve({ ticker: "AAPL", id: "123" });

    const response = await POST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Finnhub enrichment not found");
  });

  it("returns 404 if aiAnalysis is null", async () => {
    const { auth } = await import("@/lib/auth");
    const { prisma } = await import("@/shared/api/prisma");

    vi.mocked(auth).mockResolvedValue({
      user: { id: "user1", email: "test@example.com" },
      expires: "2026-12-31",
    } as unknown as Awaited<ReturnType<typeof auth>>);

    const mockEnrichment = {
      id: "enrichment1",
      ticker: "AAPL",
      source: "FINNHUB" as const,
      aiAnalysis: null,
    };

    vi.mocked(prisma.companyEnrichment.findUnique).mockResolvedValue(mockEnrichment);

    const request = new NextRequest("http://localhost:3000/api/companies/AAPL/enrich-finnhub/enrichment1/translate", {
      method: "POST",
    });
    const params = Promise.resolve({ ticker: "AAPL", id: "enrichment1" });

    const response = await POST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("No AI analysis available to translate");
  });

  it("translates aiAnalysis to Spanish without persisting", async () => {
    const { auth } = await import("@/lib/auth");
    const { prisma } = await import("@/shared/api/prisma");
    const { translateToSpanish } = await import("@/shared/api/translate");

    vi.mocked(auth).mockResolvedValue({
      user: { id: "user1", email: "test@example.com" },
      expires: "2026-12-31",
    } as unknown as Awaited<ReturnType<typeof auth>>);

    const mockEnrichment = {
      id: "enrichment1",
      ticker: "AAPL",
      source: "FINNHUB" as const,
      aiAnalysis: "Apple shows strong fundamentals with solid EPS and healthy profit margins.",
    };

    const translatedText = "Apple muestra fundamentos sólidos con un EPS sólido y márgenes de ganancia saludables.";

    vi.mocked(prisma.companyEnrichment.findUnique).mockResolvedValue(mockEnrichment);
    vi.mocked(translateToSpanish).mockResolvedValue(translatedText);

    const request = new NextRequest("http://localhost:3000/api/companies/AAPL/enrich-finnhub/enrichment1/translate", {
      method: "POST",
    });
    const params = Promise.resolve({ ticker: "AAPL", id: "enrichment1" });

    const response = await POST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.translation).toBe(translatedText);

    // Should call translate function
    expect(translateToSpanish).toHaveBeenCalledWith(mockEnrichment.aiAnalysis);
  });

  it("returns 500 on translation error", async () => {
    const { auth } = await import("@/lib/auth");
    const { prisma } = await import("@/shared/api/prisma");
    const { translateToSpanish } = await import("@/shared/api/translate");

    vi.mocked(auth).mockResolvedValue({
      user: { id: "user1", email: "test@example.com" },
      expires: "2026-12-31",
    } as unknown as Awaited<ReturnType<typeof auth>>);

    const mockEnrichment = {
      id: "enrichment1",
      ticker: "AAPL",
      source: "FINNHUB" as const,
      aiAnalysis: "Test analysis",
    };

    vi.mocked(prisma.companyEnrichment.findUnique).mockResolvedValue(mockEnrichment);
    vi.mocked(translateToSpanish).mockRejectedValue(new Error("Ollama service unavailable"));

    const request = new NextRequest("http://localhost:3000/api/companies/AAPL/enrich-finnhub/enrichment1/translate", {
      method: "POST",
    });
    const params = Promise.resolve({ ticker: "AAPL", id: "enrichment1" });

    const response = await POST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Ollama service unavailable");
  });
});
