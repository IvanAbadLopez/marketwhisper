/**
 * Test: Single Job Status API Route
 * @vitest-environment node
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";
import type { Session } from "next-auth";
import type { Job, JobType, JobStatus } from "@prisma/client";

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
    },
  },
}));

const mockAuth = vi.mocked(await import("@/lib/auth")).auth;
const mockPrisma = vi.mocked(await import("@/shared/api/prisma")).prisma;

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
