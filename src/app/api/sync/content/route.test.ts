import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Create manual mocks
const mockAuth = vi.fn();
const mockPrisma = {
  content: {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
};

// Mock modules
vi.mock("@/lib/auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

describe("POST /api/sync/content", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if user is not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const { POST } = await import("./route");
    const request = new NextRequest("http://localhost:3000/api/sync/content", {
      method: "POST",
      body: JSON.stringify({ url: "https://example.com", sourceName: "Example" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return 400 if url or sourceName is missing", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "test-id", email: "test@example.com", name: "Test User" },
      expires: "2026-12-31",
    });

    const { POST } = await import("./route");
    const request = new NextRequest("http://localhost:3000/api/sync/content", {
      method: "POST",
      body: JSON.stringify({ url: "https://example.com" }), // Missing sourceName
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Missing required fields");
  });

  it("should return success when authenticated with valid data", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "test-id", email: "test@example.com", name: "Test User" },
      expires: "2026-12-31",
    });

    mockPrisma.content.findFirst.mockResolvedValue(null);
    mockPrisma.content.create.mockResolvedValue({});

    const { POST } = await import("./route");
    const request = new NextRequest("http://localhost:3000/api/sync/content", {
      method: "POST",
      body: JSON.stringify({
        url: "https://example.com/article",
        sourceName: "Example Blog",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data).toHaveProperty("count");
    expect(data).toHaveProperty("created");
    expect(data).toHaveProperty("updated");
  });

  it("should update existing content with same URL", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "test-id", email: "test@example.com", name: "Test User" },
      expires: "2026-12-31",
    });

    // Mock existing content found
    mockPrisma.content.findFirst.mockResolvedValue({
      id: "existing-id",
      title: "Old Title",
      description: "Old description",
    });
    mockPrisma.content.update.mockResolvedValue({});

    const { POST } = await import("./route");
    const request = new NextRequest("http://localhost:3000/api/sync/content", {
      method: "POST",
      body: JSON.stringify({
        url: "https://example.com/article",
        sourceName: "Example Blog",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockPrisma.content.update).toHaveBeenCalled();
    expect(mockPrisma.content.create).not.toHaveBeenCalled();
    expect(data.updated).toBeGreaterThan(0);
  });
});
