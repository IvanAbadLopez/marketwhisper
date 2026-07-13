import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Header } from "@/widgets/header";

// Mock next-auth/react
vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

describe("Header Component", () => {
  const mockUser = {
    id: "test-id",
    name: "Test User",
    email: "test@example.com",
    image: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders user name and email", () => {
    render(<Header user={mockUser} />);
    
    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
  });

it("renders page title", () => {
    render(<Header user={mockUser} />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("renders logout button", () => {
    render(<Header user={mockUser} />);
    
    expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument();
  });

  it("displays user initial when no image is provided", () => {
    render(<Header user={mockUser} />);
    
    expect(screen.getByText("T")).toBeInTheDocument();
  });

  it("renders user image when provided", () => {
    const userWithImage = {
      ...mockUser,
      image: "https://example.com/avatar.jpg",
    };
    
    render(<Header user={userWithImage} />);
    
    const img = screen.getByAltText("Test User");
    expect(img).toHaveAttribute("src", "https://example.com/avatar.jpg");
  });
});
