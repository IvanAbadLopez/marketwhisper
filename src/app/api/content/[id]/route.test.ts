import { describe, it, expect, vi, beforeEach } from "vitest";
import { DELETE } from "./route";
import { NextRequest } from "next/server";

// Mock auth module
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

// Mock prisma module
vi.mock("@/lib/prisma", () => ({
  default: {
    content: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    mention: {
      deleteMany: vi.fn(),
    },
    transcript: {
      deleteMany: vi.fn(),
    },
  },
}));

describe("DELETE /api/content/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if user is not authenticated", async () => {
    const { auth } = await import("@/lib/auth");
    vi.mocked(auth).mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/content/123");
    const params = Promise.resolve({ id: "123" });

    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 404 if content does not exist", async () => {
    const { auth } = await import("@/lib/auth");
    const prisma = (await import("@/lib/prisma")).default;

    vi.mocked(auth).mockResolvedValue({
      user: { id: "user1", email: "test@example.com" },
      expires: "2026-12-31",
    });

    vi.mocked(prisma.content.findUnique).mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/content/123");
    const params = Promise.resolve({ id: "123" });

    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Content not found");
  });

  it("deletes content and related records successfully", async () => {
    const { auth } = await import("@/lib/auth");
    const prisma = (await import("@/lib/prisma")).default;

    vi.mocked(auth).mockResolvedValue({
      user: { id: "user1", email: "test@example.com" },
      expires: "2026-12-31",
    });

    vi.mocked(prisma.content.findUnique).mockResolvedValue({
      id: "123",
      title: "Test Content",
      description: null,
      sourceUrl: "https://example.com",
      sourceName: "Example",
      contentType: "WEB_ARTICLE",
      date: new Date(),
      tickers: ["AAPL"],
      status: "COMPLETED",
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(prisma.mention.deleteMany).mockResolvedValue({ count: 2 });
    vi.mocked(prisma.transcript.deleteMany).mockResolvedValue({ count: 1 });
    vi.mocked(prisma.content.delete).mockResolvedValue({
      id: "123",
      title: "Test Content",
      description: null,
      sourceUrl: "https://example.com",
      sourceName: "Example",
      contentType: "WEB_ARTICLE",
      date: new Date(),
      tickers: ["AAPL"],
      status: "COMPLETED",
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const request = new NextRequest("http://localhost:3000/api/content/123");
    const params = Promise.resolve({ id: "123" });

    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(prisma.mention.deleteMany).toHaveBeenCalledWith({
      where: { contentId: "123" },
    });
    expect(prisma.transcript.deleteMany).toHaveBeenCalledWith({
      where: { contentId: "123" },
    });
    expect(prisma.content.delete).toHaveBeenCalledWith({
      where: { id: "123" },
    });
  });
});
