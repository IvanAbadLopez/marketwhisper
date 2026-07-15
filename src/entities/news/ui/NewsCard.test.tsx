/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NewsCard } from "./NewsCard";
import type { NewsItem } from "@/shared";

// Mock dependencies
vi.mock("@/features/analyze-text", () => ({
  analyzeText: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}));

import { analyzeText } from "@/features/analyze-text";
import { useRouter } from "next/navigation";

const mockAnalyzeText = vi.mocked(analyzeText);
const mockPush = vi.fn();

vi.mocked(useRouter).mockReturnValue({
  push: mockPush,
} as any);

describe("NewsCard", () => {
  const mockNews: NewsItem = {
    title: "Apple announces new product",
    summary: "Apple Inc. announced a revolutionary new product today.",
    publisher: "Bloomberg",
    link: "https://example.com/news",
    publishedAt: new Date().toISOString(),
    image: "https://example.com/image.jpg",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders news title and summary", () => {
    render(<NewsCard news={mockNews} ticker="AAPL" />);

    expect(screen.getByText("Apple announces new product")).toBeInTheDocument();
    expect(screen.getByText(/Apple Inc. announced a revolutionary/)).toBeInTheDocument();
  });

  it("renders publisher and link", () => {
    render(<NewsCard news={mockNews} ticker="AAPL" />);

    expect(screen.getByText("Bloomberg")).toBeInTheDocument();
    
    const link = screen.getByRole("link", { name: /read article/i });
    expect(link).toHaveAttribute("href", "https://example.com/news");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders image when provided", () => {
    render(<NewsCard news={mockNews} ticker="AAPL" />);

    const image = screen.getByAltText("Apple announces new product");
    expect(image).toHaveAttribute("src", "https://example.com/image.jpg");
  });

  it("does not render image when not provided", () => {
    const newsWithoutImage = { ...mockNews, image: null };
    render(<NewsCard news={newsWithoutImage} ticker="AAPL" />);

    const image = screen.queryByAltText("Apple announces new product");
    expect(image).not.toBeInTheDocument();
  });

  it("renders Analyze as text button", () => {
    render(<NewsCard news={mockNews} ticker="AAPL" />);

    expect(screen.getByRole("button", { name: /analyze as text/i })).toBeInTheDocument();
  });

  it("calls analyzeText when Analyze button is clicked", async () => {
    mockAnalyzeText.mockResolvedValue(undefined);

    render(<NewsCard news={mockNews} ticker="AAPL" />);

    const analyzeButton = screen.getByRole("button", { name: /analyze as text/i });
    await userEvent.click(analyzeButton);

    await waitFor(() => {
      expect(mockAnalyzeText).toHaveBeenCalledWith({
        text: "Apple announces new product\n\nApple Inc. announced a revolutionary new product today.",
        source: "Finnhub News: Bloomberg",
      });
    });
  });

  it("uses only title if summary is null", async () => {
    mockAnalyzeText.mockResolvedValue(undefined);
    const newsWithoutSummary = { ...mockNews, summary: null };

    render(<NewsCard news={newsWithoutSummary} ticker="AAPL" />);

    const analyzeButton = screen.getByRole("button", { name: /analyze as text/i });
    await userEvent.click(analyzeButton);

    await waitFor(() => {
      expect(mockAnalyzeText).toHaveBeenCalledWith({
        text: "Apple announces new product",
        source: "Finnhub News: Bloomberg",
      });
    });
  });

  it("shows loading state while analyzing", async () => {
    mockAnalyzeText.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 1000)));

    render(<NewsCard news={mockNews} ticker="AAPL" />);

    const analyzeButton = screen.getByRole("button", { name: /analyze as text/i });
    await userEvent.click(analyzeButton);

    expect(screen.getByText(/analyzing/i)).toBeInTheDocument();
    expect(analyzeButton).toBeDisabled();
  });

  it("shows success state and redirects after successful analysis", async () => {
    mockAnalyzeText.mockResolvedValue(undefined);

    render(<NewsCard news={mockNews} ticker="AAPL" />);

    const analyzeButton = screen.getByRole("button", { name: /analyze as text/i });
    await userEvent.click(analyzeButton);

    await waitFor(() => {
      expect(screen.getByText(/queued!/i)).toBeInTheDocument();
      expect(screen.getByText(/redirecting to jobs/i)).toBeInTheDocument();
    });

    // Wait for the setTimeout redirect
    await new Promise((resolve) => setTimeout(resolve, 1600));

    expect(mockPush).toHaveBeenCalledWith("/jobs");
  });

  it("shows error message on analysis failure", async () => {
    mockAnalyzeText.mockRejectedValue(new Error("Analysis failed"));

    render(<NewsCard news={mockNews} ticker="AAPL" />);

    const analyzeButton = screen.getByRole("button", { name: /analyze as text/i });
    await userEvent.click(analyzeButton);

    await waitFor(() => {
      expect(screen.getByText("Analysis failed")).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it("formats relative date correctly", () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const newsRecent = { ...mockNews, publishedAt: twoHoursAgo.toISOString() };

    render(<NewsCard news={newsRecent} ticker="AAPL" />);

    expect(screen.getByText("2 hours ago")).toBeInTheDocument();
  });

  it("handles unknown date gracefully", () => {
    const newsNoDate = { ...mockNews, publishedAt: null };

    render(<NewsCard news={newsNoDate} ticker="AAPL" />);

    expect(screen.getByText("Unknown date")).toBeInTheDocument();
  });
});
