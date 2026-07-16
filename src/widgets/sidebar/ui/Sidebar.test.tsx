import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Sidebar } from "./Sidebar";

const mockUsePathname = vi.fn(() => "/");
vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

describe("Sidebar Component", () => {
  it("renders all navigation items", () => {
    render(<Sidebar />);
    
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Analyze")).toBeInTheDocument();
    expect(screen.getByText("Companies")).toBeInTheDocument();
    expect(screen.getByText("News")).toBeInTheDocument();
  });

  it("renders MarketWhisper logo", () => {
    render(<Sidebar />);
    
    expect(screen.getByText("MarketWhisper")).toBeInTheDocument();
    expect(screen.getByText("🎧")).toBeInTheDocument();
  });

  it("renders version information", () => {
    render(<Sidebar />);
    
    expect(screen.getByText("MarketWhisper v0.1.0")).toBeInTheDocument();
    expect(screen.getByText("AI-Powered Market Intelligence")).toBeInTheDocument();
  });

  it("renders analyze link with correct href", () => {
    render(<Sidebar />);
    
    const analyzeLink = screen.getByText("Analyze").closest("a");
    expect(analyzeLink).toHaveAttribute("href", "/analyze");
  });

  it("applies active state to current route", () => {
    mockUsePathname.mockReturnValue("/analyze");
    
    render(<Sidebar />);
    
    const analyzeLink = screen.getByText("Analyze").closest("a");
    expect(analyzeLink).toHaveClass("bg-blue-500");
  });
});
