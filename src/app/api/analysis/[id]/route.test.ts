/**
 * Tests for DELETE /api/analysis/[id]
 * @vitest-environment node
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { DELETE } from "./route";
import { NextRequest } from "next/server";

// Mock dependencies
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/shared/api/prisma", () => ({
  prisma: {
    analysis: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("@/features/analyze-text/api/processAnalysis", () => ({
  recalculateCompanyAggregatesFromScratch: vi.fn(),
}));

vi.mock("@/entities/company/api/recomputeValuation", () => ({
  recomputeCompanyValuation: vi.fn(),
}));

describe("DELETE /api/analysis/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if user is not authenticated", async () => {
    const { auth } = await import("@/lib/auth");
    vi.mocked(auth).mockResolvedValue(null as unknown as Awaited<ReturnType<typeof auth>>);

    const request = new NextRequest("http://localhost:3000/api/analysis/analysis123");
    const params = Promise.resolve({ id: "analysis123" });
    
    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return 400 if analysis ID is missing", async () => {
    const { auth } = await import("@/lib/auth");
    vi.mocked(auth).mockResolvedValue({
      user: { email: "test@example.com" },
      expires: "2026-12-31",
    } as unknown as Awaited<ReturnType<typeof auth>>);

    const request = new NextRequest("http://localhost:3000/api/analysis/");
    const params = Promise.resolve({ id: "" });
    
    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Analysis ID is required");
  });

  it("should return 404 if analysis does not exist", async () => {
    const { auth } = await import("@/lib/auth");
    const { prisma } = await import("@/shared/api/prisma");

    vi.mocked(auth).mockResolvedValue({
      user: { email: "test@example.com" },
      expires: "2026-12-31",
    } as unknown as Awaited<ReturnType<typeof auth>>);

    vi.mocked(prisma.analysis.findUnique).mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/analysis/nonexistent");
    const params = Promise.resolve({ id: "nonexistent" });
    
    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Analysis not found");
  });

  it("should successfully delete analysis and recompute metrics", async () => {
    const { auth } = await import("@/lib/auth");
    const { prisma } = await import("@/shared/api/prisma");
    const { recalculateCompanyAggregatesFromScratch } = await import("@/features/analyze-text/api/processAnalysis");
    const { recomputeCompanyValuation } = await import("@/entities/company/api/recomputeValuation");

    const mockAnalysis = {
      id: "analysis123",
      companyId: "company123",
      ticker: "AAPL",
      text: "Test analysis",
      sentiment: "BULLISH",
      reliabilityScore: 8,
      reasoning: "Good company",
      createdAt: new Date(),
    };

    vi.mocked(auth).mockResolvedValue({
      user: { email: "test@example.com" },
      expires: "2026-12-31",
    } as unknown as Awaited<ReturnType<typeof auth>>);

    vi.mocked(prisma.analysis.findUnique).mockResolvedValue(mockAnalysis as any);
    vi.mocked(prisma.analysis.delete).mockResolvedValue(mockAnalysis as any);

    const request = new NextRequest("http://localhost:3000/api/analysis/analysis123");
    const params = Promise.resolve({ id: "analysis123" });
    
    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe("Analysis deleted and company metrics recomputed");

    // Verify analysis was deleted
    expect(prisma.analysis.delete).toHaveBeenCalledWith({
      where: { id: "analysis123" },
    });

    // Verify aggregate recomputation was called
    expect(recalculateCompanyAggregatesFromScratch).toHaveBeenCalledWith("company123");
    
    // Verify valuation recomputation was called
    expect(recomputeCompanyValuation).toHaveBeenCalledWith("company123");
  });

  it("should return 500 if deletion fails", async () => {
    const { auth } = await import("@/lib/auth");
    const { prisma } = await import("@/shared/api/prisma");

    vi.mocked(auth).mockResolvedValue({
      user: { email: "test@example.com" },
      expires: "2026-12-31",
    } as unknown as Awaited<ReturnType<typeof auth>>);

    vi.mocked(prisma.analysis.findUnique).mockResolvedValue({
      id: "analysis123",
      companyId: "company123",
      ticker: "AAPL",
    } as any);

    vi.mocked(prisma.analysis.delete).mockRejectedValue(new Error("Database error"));

    const request = new NextRequest("http://localhost:3000/api/analysis/analysis123");
    const params = Promise.resolve({ id: "analysis123" });
    
    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to delete analysis");
  });
});
