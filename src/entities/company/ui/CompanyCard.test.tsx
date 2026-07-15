/**
 * Tests for CompanyCard component
 * @module entities/company
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CompanyCard } from "./CompanyCard";
import type { Company } from "../model/types";

describe("CompanyCard", () => {
  const mockCompany: Company = {
    id: "1",
    ticker: "AAPL",
    name: "Apple Inc.",
    description: "Technology company",
    sector: "Technology",
    industry: "Consumer Electronics",
    marketCap: 3000000000000,
    website: "https://apple.com",
    logoUrl: null,
    avgSentimentScore: 0.5,
    avgReliabilityScore: 8.5,
    analysisCount: 5,
    globalScore: 75,
    globalScoreLabel: "Strong",
    _count: {
      analyses: 5,
    },
  };

  it("should render company name and ticker", () => {
    render(<CompanyCard company={mockCompany} />);
    
    expect(screen.getByText("Apple Inc.")).toBeInTheDocument();
    expect(screen.getByText("$AAPL")).toBeInTheDocument();
  });

  it("should render sector information", () => {
    render(<CompanyCard company={mockCompany} />);
    
    expect(screen.getByText("Technology")).toBeInTheDocument();
  });

  it("should render global score when available", () => {
    render(<CompanyCard company={mockCompany} />);
    
    expect(screen.getByText("Global Score")).toBeInTheDocument();
    expect(screen.getByText("75")).toBeInTheDocument();
    expect(screen.getByText("/100")).toBeInTheDocument();
    expect(screen.getByText("Strong")).toBeInTheDocument();
  });

  it("should not render global score when null", () => {
    const companyWithoutScore: Company = {
      ...mockCompany,
      globalScore: null,
      globalScoreLabel: null,
    };

    render(<CompanyCard company={companyWithoutScore} />);
    
    expect(screen.queryByText("Global Score")).not.toBeInTheDocument();
  });

  it("should render analysis count", () => {
    render(<CompanyCard company={mockCompany} />);
    
    expect(screen.getByText("5 analyses")).toBeInTheDocument();
  });

  it("should render singular 'analysis' for count of 1", () => {
    const companyWithOneAnalysis: Company = {
      ...mockCompany,
      analysisCount: 1,
      _count: { analyses: 1 },
    };

    render(<CompanyCard company={companyWithOneAnalysis} />);
    
    expect(screen.getByText("1 analysis")).toBeInTheDocument();
  });

  it("should call onClick with ticker when clicked", async () => {
    const user = userEvent.setup();
    const onClickMock = vi.fn();

    render(<CompanyCard company={mockCompany} onClick={onClickMock} />);
    
    const card = screen.getByText("Apple Inc.").closest("div");
    if (card) {
      await user.click(card);
      expect(onClickMock).toHaveBeenCalledWith("AAPL");
    }
  });

  it("should not render sector if not provided", () => {
    const companyWithoutSector: Company = {
      ...mockCompany,
      sector: null,
    };

    render(<CompanyCard company={companyWithoutSector} />);
    
    expect(screen.queryByText("Technology")).not.toBeInTheDocument();
  });

  it("should render different global score colors based on score value", () => {
    const { container: container1 } = render(
      <CompanyCard company={{ ...mockCompany, globalScore: 85 }} />
    );
    expect(container1.querySelector(".bg-green-500")).toBeInTheDocument();

    const { container: container2 } = render(
      <CompanyCard company={{ ...mockCompany, globalScore: 70 }} />
    );
    expect(container2.querySelector(".bg-blue-500")).toBeInTheDocument();

    const { container: container3 } = render(
      <CompanyCard company={{ ...mockCompany, globalScore: 50 }} />
    );
    expect(container3.querySelector(".bg-amber-500")).toBeInTheDocument();

    const { container: container4 } = render(
      <CompanyCard company={{ ...mockCompany, globalScore: 30 }} />
    );
    expect(container4.querySelector(".bg-red-500")).toBeInTheDocument();
  });

  it("should render different label colors based on global score label", () => {
    const { rerender } = render(
      <CompanyCard company={{ ...mockCompany, globalScoreLabel: "Strong" }} />
    );
    expect(screen.getByText("Strong")).toHaveClass("text-green-600");

    rerender(
      <CompanyCard company={{ ...mockCompany, globalScoreLabel: "Moderate" }} />
    );
    expect(screen.getByText("Moderate")).toHaveClass("text-amber-600");

    rerender(
      <CompanyCard company={{ ...mockCompany, globalScoreLabel: "Neutral" }} />
    );
    expect(screen.getByText("Neutral")).toHaveClass("text-blue-600");

    rerender(
      <CompanyCard company={{ ...mockCompany, globalScoreLabel: "Weak" }} />
    );
    expect(screen.getByText("Weak")).toHaveClass("text-red-600");
  });

  it("should render Target icon for global score", () => {
    const { container } = render(<CompanyCard company={mockCompany} />);
    
    // The Target icon from lucide-react should be present
    const targetIcon = container.querySelector("svg");
    expect(targetIcon).toBeInTheDocument();
  });

  it("should handle company with zero analyses", () => {
    const companyWithNoAnalyses: Company = {
      ...mockCompany,
      analysisCount: 0,
      globalScore: null,
      globalScoreLabel: null,
      _count: { analyses: 0 },
    };

    render(<CompanyCard company={companyWithNoAnalyses} />);
    
    expect(screen.getByText("0 analyses")).toBeInTheDocument();
    expect(screen.queryByText("Global Score")).not.toBeInTheDocument();
  });
});
