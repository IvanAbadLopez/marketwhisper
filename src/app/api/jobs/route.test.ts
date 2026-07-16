/**
 * Test: Jobs List API Route
 * @vitest-environment node
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
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
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

const mockAuth = vi.mocked(await import("@/lib/auth")).auth;
const mockPrisma = vi.mocked(await import("@/shared/api/prisma")).prisma;

describe("GET /api/jobs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/jobs");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: "Unauthorized" });
  });

  it("should return all jobs for authenticated user", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user1", email: "test@example.com" },
      expires: "2026-12-31",
    } as Session);

    // Mock user lookup
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user1",
      email: "test@example.com",
    } as any);

    const mockJobs: Job[] = [
      {
        id: "job1",
        userId: "user1",
        type: "ANALYSIS" as JobType,
        status: "COMPLETED" as JobStatus,
        ticker: "AAPL",
        result: { analyses: [], companies: [] },
        errorMessage: null,
        analysisId: null,
        enrichmentId: null,
        createdAt: new Date("2026-07-08T10:00:00Z"),
        updatedAt: new Date("2026-07-08T10:01:00Z"),
      },
      {
        id: "job2",
        userId: "user1",
        type: "ENRICHMENT" as JobType,
        status: "PROCESSING" as JobStatus,
        ticker: "MSFT",
        result: null,
        errorMessage: null,
        analysisId: null,
        enrichmentId: "enrich1",
        createdAt: new Date("2026-07-08T10:05:00Z"),
        updatedAt: new Date("2026-07-08T10:05:00Z"),
      },
    ];

    mockPrisma.job.findMany.mockResolvedValue(mockJobs);
    mockPrisma.job.count.mockResolvedValue(2);

    const request = new NextRequest("http://localhost:3000/api/jobs");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.jobs).toHaveLength(2);
    expect(data.count).toBe(2);
    expect(data.jobs[0].id).toBe("job1");
    expect(data.jobs[1].id).toBe("job2");

    // Verify query was correct
    expect(mockPrisma.job.findMany).toHaveBeenCalledWith({
      where: { userId: "user1" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        type: true,
        status: true,
        ticker: true,
        result: true,
        errorMessage: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  });

  it("should filter jobs by type ANALYSIS", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user1", email: "test@example.com" },
      expires: "2026-12-31",
    } as Session);

    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user1",
      email: "test@example.com",
    } as any);

    const mockJobs: Job[] = [
      {
        id: "job1",
        userId: "user1",
        type: "ANALYSIS" as JobType,
        status: "COMPLETED" as JobStatus,
        ticker: "AAPL",
        result: { analyses: [] },
        errorMessage: null,
        analysisId: null,
        enrichmentId: null,
        createdAt: new Date("2026-07-08T10:00:00Z"),
        updatedAt: new Date("2026-07-08T10:01:00Z"),
      },
    ];

    mockPrisma.job.findMany.mockResolvedValue(mockJobs);
    mockPrisma.job.count.mockResolvedValue(1);

    const request = new NextRequest("http://localhost:3000/api/jobs?type=ANALYSIS");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.jobs).toHaveLength(1);
    expect(data.jobs[0].type).toBe("ANALYSIS");

    // Verify type filter was applied
    expect(mockPrisma.job.findMany).toHaveBeenCalledWith({
      where: {
        userId: "user1",
        type: "ANALYSIS",
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        type: true,
        status: true,
        ticker: true,
        result: true,
        errorMessage: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  });

  it("should filter jobs by status (single value)", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user1", email: "test@example.com" },
      expires: "2026-12-31",
    } as Session);

    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user1",
      email: "test@example.com",
    } as any);

    const mockJobs: Job[] = [
      {
        id: "job1",
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
      },
    ];

    mockPrisma.job.findMany.mockResolvedValue(mockJobs);
    mockPrisma.job.count.mockResolvedValue(1);

    const request = new NextRequest("http://localhost:3000/api/jobs?status=PENDING");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.jobs).toHaveLength(1);
    expect(data.jobs[0].status).toBe("PENDING");

    // Verify status filter was applied
    expect(mockPrisma.job.findMany).toHaveBeenCalledWith({
      where: {
        userId: "user1",
        status: { in: ["PENDING"] },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        type: true,
        status: true,
        ticker: true,
        result: true,
        errorMessage: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  });

  it("should filter jobs by multiple statuses", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user1", email: "test@example.com" },
      expires: "2026-12-31",
    } as Session);

    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user1",
      email: "test@example.com",
    } as any);

    const mockJobs: Job[] = [
      {
        id: "job1",
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
      },
      {
        id: "job2",
        userId: "user1",
        type: "ENRICHMENT" as JobType,
        status: "PROCESSING" as JobStatus,
        ticker: "MSFT",
        result: null,
        errorMessage: null,
        analysisId: null,
        enrichmentId: "enrich1",
        createdAt: new Date("2026-07-08T10:01:00Z"),
        updatedAt: new Date("2026-07-08T10:01:00Z"),
      },
    ];

    mockPrisma.job.findMany.mockResolvedValue(mockJobs);
    mockPrisma.job.count.mockResolvedValue(2);

    const request = new NextRequest("http://localhost:3000/api/jobs?status=PENDING,PROCESSING");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.jobs).toHaveLength(2);
    expect(data.count).toBe(2);

    // Verify status filter with multiple values was applied
    expect(mockPrisma.job.findMany).toHaveBeenCalledWith({
      where: {
        userId: "user1",
        status: { in: ["PENDING", "PROCESSING"] },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        type: true,
        status: true,
        ticker: true,
        result: true,
        errorMessage: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  });

  it("should filter by both type and status", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user1", email: "test@example.com" },
      expires: "2026-12-31",
    } as Session);

    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user1",
      email: "test@example.com",
    } as any);

    const mockJobs: Job[] = [
      {
        id: "job1",
        userId: "user1",
        type: "ANALYSIS" as JobType,
        status: "COMPLETED" as JobStatus,
        ticker: "AAPL",
        result: { analyses: [] },
        errorMessage: null,
        analysisId: null,
        enrichmentId: null,
        createdAt: new Date("2026-07-08T10:00:00Z"),
        updatedAt: new Date("2026-07-08T10:01:00Z"),
      },
    ];

    mockPrisma.job.findMany.mockResolvedValue(mockJobs);
    mockPrisma.job.count.mockResolvedValue(1);

    const request = new NextRequest("http://localhost:3000/api/jobs?type=ANALYSIS&status=COMPLETED");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.jobs).toHaveLength(1);

    // Verify both filters were applied
    expect(mockPrisma.job.findMany).toHaveBeenCalledWith({
      where: {
        userId: "user1",
        type: "ANALYSIS",
        status: { in: ["COMPLETED"] },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        type: true,
        status: true,
        ticker: true,
        result: true,
        errorMessage: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  });

  it("should return empty array when no jobs match filters", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user1", email: "test@example.com" },
      expires: "2026-12-31",
    } as Session);

    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user1",
      email: "test@example.com",
    } as any);

    mockPrisma.job.findMany.mockResolvedValue([]);
    mockPrisma.job.count.mockResolvedValue(0);

    const request = new NextRequest("http://localhost:3000/api/jobs?type=ANALYSIS&status=FAILED");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.jobs).toHaveLength(0);
    expect(data.count).toBe(0);
  });
});
