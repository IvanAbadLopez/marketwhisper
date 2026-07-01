import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Create manual mocks
const mockAuth = vi.fn();
const mockPrisma = {
  specialSituation: {
    findFirst: vi.fn(),
    create: vi.fn(),
  },
};

// Mock modules
vi.mock("@/lib/auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

describe("POST /api/sync/situations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if user is not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const { POST } = await import("./route");
    const request = new NextRequest("http://localhost:3000/api/sync/situations", {
      method: "POST",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return success when authenticated", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "test-id", email: "test@example.com", name: "Test User" },
      expires: "2026-12-31",
    });

    mockPrisma.specialSituation.findFirst.mockResolvedValue(null);
    mockPrisma.specialSituation.create.mockResolvedValue({});

    const { POST } = await import("./route");
    const request = new NextRequest("http://localhost:3000/api/sync/situations", {
      method: "POST",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data).toHaveProperty("count");
    expect(data).toHaveProperty("message");
    expect(data.count).toBeGreaterThanOrEqual(0);
  });

  it("should not create duplicate situations", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "test-id", email: "test@example.com", name: "Test User" },
      expires: "2026-12-31",
    });

    // Mock all situations as already existing
    mockPrisma.specialSituation.findFirst.mockResolvedValue({
      id: "existing-id",
      title: "Existing Situation",
    });

    const { POST } = await import("./route");
    const request = new NextRequest("http://localhost:3000/api/sync/situations", {
      method: "POST",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.count).toBe(0); // No new situations saved
    expect(mockPrisma.specialSituation.create).not.toHaveBeenCalled();
  });
});



