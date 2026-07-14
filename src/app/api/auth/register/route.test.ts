/**
 * Test: User Registration API Route
 * @vitest-environment node
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";

// Mock dependencies
vi.mock("@/shared", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

const mockPrisma = vi.mocked(await import("@/shared")).prisma;

function buildRequest(body: unknown): Request {
  return new Request("http://localhost:3000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 if email is missing", async () => {
    const response = await POST(buildRequest({ password: "password123" }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: "Email and password are required" });
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });

  it("should return 400 if password is missing", async () => {
    const response = await POST(buildRequest({ email: "test@example.com" }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: "Email and password are required" });
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });

  it("should return 400 if password is shorter than 8 characters", async () => {
    const response = await POST(
      buildRequest({ email: "test@example.com", password: "short1" })
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: "Password must be at least 8 characters" });
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });

  it("should return 409 if email is already registered", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "existing-user",
      email: "test@example.com",
    } as never);

    const response = await POST(
      buildRequest({ email: "test@example.com", password: "password123" })
    );
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data).toEqual({ error: "Email already registered" });
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });

  it("should create a user and return 201 on success", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: "new-user-id",
      email: "new@example.com",
      name: "New User",
    } as never);

    const response = await POST(
      buildRequest({
        email: "new@example.com",
        password: "password123",
        name: "New User",
      })
    );
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toEqual({
      message: "User created successfully",
      userId: "new-user-id",
    });

    // Password must be hashed, never stored in plain text
    const createArgs = mockPrisma.user.create.mock.calls[0][0];
    expect(createArgs.data.password).toBeDefined();
    expect(createArgs.data.password).not.toBe("password123");
    expect(createArgs.data.email).toBe("new@example.com");
    expect(createArgs.data.name).toBe("New User");
  });

  it("should store name as null when not provided", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: "new-user-id",
      email: "new@example.com",
      name: null,
    } as never);

    const response = await POST(
      buildRequest({ email: "new@example.com", password: "password123" })
    );

    expect(response.status).toBe(201);
    const createArgs = mockPrisma.user.create.mock.calls[0][0];
    expect(createArgs.data.name).toBeNull();
  });

  it("should return 500 if an unexpected error occurs", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockRejectedValue(new Error("DB down"));

    const response = await POST(
      buildRequest({ email: "new@example.com", password: "password123" })
    );
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: "Internal server error" });
  });
});
