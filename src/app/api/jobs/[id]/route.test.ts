/**
 * Test: Single Job Status API Route
 * @vitest-environment node
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PATCH } from "./route";
import { NextRequest } from "next/server";
import type { Session } from "next-auth";
import type { Job, JobType, JobStatus } from "@/generated/prisma/client";

// Mock dependencies
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/shared/api/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    job: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
    },
    analysis: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    companyEnrichment: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock("@/features/analyze-text/api/processAnalysis", () => ({
  recalculateCompanyAggregatesFromScratch: vi.fn(),
}));

vi.mock("@/entities/company/api/recomputeValuation", () => ({
  recomputeCompanyValuation: vi.fn(),
}));

const mockAuth = vi.mocked(await import("@/lib/auth")).auth;
const mockPrisma = vi.mocked(await import("@/shared/api/prisma")).prisma;
const mockRecalculate = vi.mocked(await import("@/features/analyze-text/api/processAnalysis")).recalculateCompanyAggregatesFromScratch;
const mockRecompute = vi.mocked(await import("@/entities/company/api/recomputeValuation")).recomputeCompanyValuation;

describe("GET /api/jobs/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/jobs/job123");
    const params = Promise.resolve({ id: "job123" });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: "Unauthorized" });
  });

  it("should return 404 if job does not exist", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user1", email: "test@example.com" },
      expires: "2026-12-31",
    } as Session);

    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user1",
      email: "test@example.com",
    } as any);

    mockPrisma.job.findUnique.mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/jobs/nonexistent");
    const params = Promise.resolve({ id: "nonexistent" });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ error: "Job not found" });
  });

  it("should return 403 if job belongs to different user", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user1", email: "test@example.com" },
      expires: "2026-12-31",
    } as Session);

    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user1",
      email: "test@example.com",
    } as any);

    const mockJob: Job = {
      id: "job123",
      userId: "user2", // Different user
      type: "ANALYSIS" as JobType,
      status: "COMPLETED" as JobStatus,
      ticker: "AAPL",
      result: { analyses: [] },
      errorMessage: null,
      analysisId: null,
      enrichmentId: null,
      createdAt: new Date("2026-07-08T10:00:00Z"),
      updatedAt: new Date("2026-07-08T10:01:00Z"),
    };

    mockPrisma.job.findUnique.mockResolvedValue(mockJob);

    const request = new NextRequest("http://localhost:3000/api/jobs/job123");
    const params = Promise.resolve({ id: "job123" });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data).toEqual({ error: "Forbidden" });
  });

  it("should return job with PENDING status", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user1", email: "test@example.com" },
      expires: "2026-12-31",
    } as Session);

    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user1",
      email: "test@example.com",
    } as any);

    const mockJob: Job = {
      id: "job123",
      userId: "user1",
      type: "ANALYSIS" as JobType,
      status: "PENDING" as JobStatus,
      ticker: "AAPL",
      result: null,
      errorMessage: null,
      analysisId: null,
      enrichmentId: null,
      createdAt: new Date("2026-07-08T10:00:00Z"),
      updatedAt: new Date("2026-07-08T10:00:00Z"),
    };

    mockPrisma.job.findUnique.mockResolvedValue(mockJob);

    const request = new NextRequest("http://localhost:3000/api/jobs/job123");
    const params = Promise.resolve({ id: "job123" });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.jobId).toBe("job123");
    expect(data.status).toBe("PENDING");
    expect(data.type).toBe("ANALYSIS");
    expect(data.ticker).toBe("AAPL");
    expect(data.result).toBeNull();
    expect(data.errorMessage).toBeNull();
  });

  it("should return job with PROCESSING status", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user1", email: "test@example.com" },
      expires: "2026-12-31",
    } as Session);

    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user1",
      email: "test@example.com",
    } as any);

    const mockJob: Job = {
      id: "job456",
      userId: "user1",
      type: "ENRICHMENT" as JobType,
      status: "PROCESSING" as JobStatus,
      ticker: "MSFT",
      result: null,
      errorMessage: null,
      analysisId: null,
      enrichmentId: "enrich1",
      createdAt: new Date("2026-07-08T10:00:00Z"),
      updatedAt: new Date("2026-07-08T10:01:00Z"),
    };

    mockPrisma.job.findUnique.mockResolvedValue(mockJob);

    const request = new NextRequest("http://localhost:3000/api/jobs/job456");
    const params = Promise.resolve({ id: "job456" });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.jobId).toBe("job456");
    expect(data.status).toBe("PROCESSING");
    expect(data.type).toBe("ENRICHMENT");
    expect(data.ticker).toBe("MSFT");
  });

  it("should return job with COMPLETED status and result", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user1", email: "test@example.com" },
      expires: "2026-12-31",
    } as Session);

    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user1",
      email: "test@example.com",
    } as any);

    const mockResult = {
      analyses: [
        {
          id: "analysis1",
          ticker: "AAPL",
          sentiment: "BULLISH",
          reliabilityScore: 8,
          reasoning: "Strong earnings report",
        },
      ],
      companies: [
        {
          ticker: "AAPL",
          name: "Apple Inc.",
          analysisCount: 1,
        },
      ],
    };

    const mockJob: Job = {
      id: "job789",
      userId: "user1",
      type: "ANALYSIS" as JobType,
      status: "COMPLETED" as JobStatus,
      ticker: "AAPL",
      result: mockResult,
      errorMessage: null,
      analysisId: "analysis1",
      enrichmentId: null,
      createdAt: new Date("2026-07-08T10:00:00Z"),
      updatedAt: new Date("2026-07-08T10:02:00Z"),
    };

    mockPrisma.job.findUnique.mockResolvedValue(mockJob);

    const request = new NextRequest("http://localhost:3000/api/jobs/job789");
    const params = Promise.resolve({ id: "job789" });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.jobId).toBe("job789");
    expect(data.status).toBe("COMPLETED");
    expect(data.result).toEqual(mockResult);
    expect(data.result.analyses).toHaveLength(1);
    expect(data.result.analyses[0].ticker).toBe("AAPL");
  });

  it("should return job with FAILED status and error message", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user1", email: "test@example.com" },
      expires: "2026-12-31",
    } as Session);

    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user1",
      email: "test@example.com",
    } as any);

    const mockJob: Job = {
      id: "job999",
      userId: "user1",
      type: "ENRICHMENT" as JobType,
      status: "FAILED" as JobStatus,
      ticker: "INVALID",
      result: null,
      errorMessage: "Ticker not found in Finnhub",
      analysisId: null,
      enrichmentId: "enrich2",
      createdAt: new Date("2026-07-08T10:00:00Z"),
      updatedAt: new Date("2026-07-08T10:01:00Z"),
    };

    mockPrisma.job.findUnique.mockResolvedValue(mockJob);

    const request = new NextRequest("http://localhost:3000/api/jobs/job999");
    const params = Promise.resolve({ id: "job999" });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.jobId).toBe("job999");
    expect(data.status).toBe("FAILED");
    expect(data.errorMessage).toBe("Ticker not found in Finnhub");
    expect(data.result).toBeNull();
  });

  it("should verify findUnique is called with correct job ID", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user1", email: "test@example.com" },
      expires: "2026-12-31",
    } as Session);

    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user1",
      email: "test@example.com",
    } as any);

    const mockJob: Job = {
      id: "specific-job-id",
      userId: "user1",
      type: "ANALYSIS" as JobType,
      status: "COMPLETED" as JobStatus,
      ticker: "AAPL",
      result: {},
      errorMessage: null,
      analysisId: null,
      enrichmentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockPrisma.job.findUnique.mockResolvedValue(mockJob);

    const request = new NextRequest("http://localhost:3000/api/jobs/specific-job-id");
    const params = Promise.resolve({ id: "specific-job-id" });
    await GET(request, { params });

    expect(mockPrisma.job.findUnique).toHaveBeenCalledWith({
      where: { id: "specific-job-id" },
    });
  });
});

describe("PATCH /api/jobs/[id] - Cancel Job", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/jobs/job123", { method: "PATCH" });
    const params = Promise.resolve({ id: "job123" });
    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: "Unauthorized" });
  });

  it("should return 404 if job does not exist", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user1", email: "test@example.com" },
      expires: "2026-12-31",
    } as Session);

    mockPrisma.user.findUnique.mockResolvedValue({ id: "user1", email: "test@example.com" } as any);
    mockPrisma.job.findUnique.mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/jobs/nonexistent", { method: "PATCH" });
    const params = Promise.resolve({ id: "nonexistent" });
    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ error: "Job not found" });
  });

  it("should return 403 if job belongs to different user", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user1", email: "test@example.com" },
      expires: "2026-12-31",
    } as Session);

    mockPrisma.user.findUnique.mockResolvedValue({ id: "user1", email: "test@example.com" } as any);
    mockPrisma.job.findUnique.mockResolvedValue({
      id: "job123",
      userId: "user2", // Different user
      type: "ANALYSIS",
      status: "PENDING",
    } as Job);

    const request = new NextRequest("http://localhost:3000/api/jobs/job123", { method: "PATCH" });
    const params = Promise.resolve({ id: "job123" });
    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data).toEqual({ error: "Forbidden" });
  });

  it("should return 400 if job is already COMPLETED", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user1", email: "test@example.com" },
      expires: "2026-12-31",
    } as Session);

    mockPrisma.user.findUnique.mockResolvedValue({ id: "user1", email: "test@example.com" } as any);
    mockPrisma.job.findUnique.mockResolvedValue({
      id: "job123",
      userId: "user1",
      type: "ANALYSIS",
      status: "COMPLETED",
    } as Job);

    const request = new NextRequest("http://localhost:3000/api/jobs/job123", { method: "PATCH" });
    const params = Promise.resolve({ id: "job123" });
    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Job cannot be cancelled");
  });

  it("should cancel a PENDING job successfully", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user1", email: "test@example.com" },
      expires: "2026-12-31",
    } as Session);

    mockPrisma.user.findUnique.mockResolvedValue({ id: "user1", email: "test@example.com" } as any);
    mockPrisma.job.findUnique.mockResolvedValue({
      id: "job123",
      userId: "user1",
      type: "ANALYSIS",
      status: "PENDING",
    } as Job);

    mockPrisma.job.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.analysis.findMany.mockResolvedValue([]); // No analyses yet

    const request = new NextRequest("http://localhost:3000/api/jobs/job123", { method: "PATCH" });
    const params = Promise.resolve({ id: "job123" });
    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      status: "CANCELLED",
      message: "Job cancelled successfully",
    });

    expect(mockPrisma.job.updateMany).toHaveBeenCalledWith({
      where: {
        id: "job123",
        status: { in: ["PENDING", "PROCESSING"] },
      },
      data: {
        status: "CANCELLED",
        errorMessage: "Cancelled by user",
      },
    });
  });

  it("should cancel a PROCESSING ANALYSIS job and revert analyses", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user1", email: "test@example.com" },
      expires: "2026-12-31",
    } as Session);

    mockPrisma.user.findUnique.mockResolvedValue({ id: "user1", email: "test@example.com" } as any);
    mockPrisma.job.findUnique.mockResolvedValue({
      id: "job123",
      userId: "user1",
      type: "ANALYSIS",
      status: "PROCESSING",
    } as Job);

    mockPrisma.job.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.job.update.mockResolvedValue({} as any);
    mockPrisma.analysis.findMany.mockResolvedValue([
      { id: "analysis1", companyId: "company1" },
      { id: "analysis2", companyId: "company1" },
      { id: "analysis3", companyId: "company2" },
    ] as any);
    mockPrisma.analysis.deleteMany.mockResolvedValue({ count: 3 });

    const request = new NextRequest("http://localhost:3000/api/jobs/job123", { method: "PATCH" });
    const params = Promise.resolve({ id: "job123" });
    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    // Should clear analysisId reference first
    expect(mockPrisma.job.update).toHaveBeenCalledWith({
      where: { id: "job123" },
      data: { analysisId: null },
    });

    // Should delete analyses
    expect(mockPrisma.analysis.deleteMany).toHaveBeenCalledWith({
      where: { jobId: "job123" },
    });

    // Should recalculate for both companies
    expect(mockRecalculate).toHaveBeenCalledTimes(2);
    expect(mockRecalculate).toHaveBeenCalledWith("company1");
    expect(mockRecalculate).toHaveBeenCalledWith("company2");

    expect(mockRecompute).toHaveBeenCalledTimes(2);
    expect(mockRecompute).toHaveBeenCalledWith("company1");
    expect(mockRecompute).toHaveBeenCalledWith("company2");
  });

  it("should cancel a PROCESSING ENRICHMENT job and revert enrichment", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user1", email: "test@example.com" },
      expires: "2026-12-31",
    } as Session);

    mockPrisma.user.findUnique.mockResolvedValue({ id: "user1", email: "test@example.com" } as any);
    mockPrisma.job.findUnique.mockResolvedValue({
      id: "job456",
      userId: "user1",
      type: "ENRICHMENT",
      status: "PROCESSING",
    } as Job);

    mockPrisma.job.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.job.update.mockResolvedValue({} as any);
    mockPrisma.companyEnrichment.findMany.mockResolvedValue([
      { id: "enrich1" },
    ] as any);
    mockPrisma.companyEnrichment.deleteMany.mockResolvedValue({ count: 1 });

    const request = new NextRequest("http://localhost:3000/api/jobs/job456", { method: "PATCH" });
    const params = Promise.resolve({ id: "job456" });
    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    // Should clear enrichmentId reference first
    expect(mockPrisma.job.update).toHaveBeenCalledWith({
      where: { id: "job456" },
      data: { enrichmentId: null },
    });

    // Should delete enrichment
    expect(mockPrisma.companyEnrichment.deleteMany).toHaveBeenCalledWith({
      where: { jobId: "job456" },
    });

    // Should not call analysis recalculation functions
    expect(mockRecalculate).not.toHaveBeenCalled();
  });

  it("should return 409 if job status changed before update", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user1", email: "test@example.com" },
      expires: "2026-12-31",
    } as Session);

    mockPrisma.user.findUnique.mockResolvedValue({ id: "user1", email: "test@example.com" } as any);
    mockPrisma.job.findUnique.mockResolvedValue({
      id: "job123",
      userId: "user1",
      type: "ANALYSIS",
      status: "PROCESSING",
    } as Job);

    mockPrisma.job.updateMany.mockResolvedValue({ count: 0 }); // Race condition - job completed

    const request = new NextRequest("http://localhost:3000/api/jobs/job123", { method: "PATCH" });
    const params = Promise.resolve({ id: "job123" });
    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toContain("Job status changed before cancellation");
  });

  it("should return 500 on internal error", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user1", email: "test@example.com" },
      expires: "2026-12-31",
    } as Session);

    mockPrisma.user.findUnique.mockRejectedValue(new Error("Database error"));

    const request = new NextRequest("http://localhost:3000/api/jobs/job123", { method: "PATCH" });
    const params = Promise.resolve({ id: "job123" });
    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Database error"); // Error message is propagated
  });
});
