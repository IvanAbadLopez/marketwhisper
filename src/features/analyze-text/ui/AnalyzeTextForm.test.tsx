import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AnalyzeTextForm } from "./AnalyzeTextForm";
import * as analyzeTextApi from "../api/analyzeText";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock analyzeText API
vi.mock("../api/analyzeText", () => ({
  analyzeText: vi.fn(),
}));

describe("AnalyzeTextForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders form fields and analyze button", () => {
    render(<AnalyzeTextForm />);
    
    expect(screen.getByPlaceholderText(/Paste any text about a company/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e.g., Twitter, Bloomberg, Reddit/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Analyze/i })).toBeInTheDocument();
  });

  it("disables analyze button when text is empty", () => {
    render(<AnalyzeTextForm />);
    
    const analyzeButton = screen.getByRole("button", { name: /Analyze/i });
    expect(analyzeButton).toBeDisabled();
  });

  it("enables analyze button when text is provided", () => {
    render(<AnalyzeTextForm />);
    
    const textarea = screen.getByPlaceholderText(/Paste any text about a company/);
    fireEvent.change(textarea, { target: { value: "AAPL is looking good" } });
    
    const analyzeButton = screen.getByRole("button", { name: /Analyze/i });
    expect(analyzeButton).not.toBeDisabled();
  });

  it("clears form when clear button is clicked", () => {
    render(<AnalyzeTextForm />);
    
    const textarea = screen.getByPlaceholderText(/Paste any text about a company/);
    const sourceInput = screen.getByPlaceholderText(/e.g., Twitter, Bloomberg, Reddit/);
    
    fireEvent.change(textarea, { target: { value: "Test text" } });
    fireEvent.change(sourceInput, { target: { value: "Twitter" } });
    
    const clearButton = screen.getAllByRole("button")[1]; // Second button is clear
    fireEvent.click(clearButton);
    
    expect(textarea).toHaveValue("");
    expect(sourceInput).toHaveValue("");
  });

  it("displays error message when analysis fails", async () => {
    vi.mocked(analyzeTextApi.analyzeText).mockRejectedValue(new Error("API Error"));
    
    render(<AnalyzeTextForm />);
    
    const textarea = screen.getByPlaceholderText(/Paste any text about a company/);
    fireEvent.change(textarea, { target: { value: "AAPL is great" } });
    
    const analyzeButton = screen.getByRole("button", { name: /Analyze/i });
    fireEvent.click(analyzeButton);
    
    await waitFor(() => {
      expect(screen.getByText("API Error")).toBeInTheDocument();
    });
  });

  it("displays success message and view in queue link", async () => {
    const mockResponse = {
      success: true,
      jobId: "job-123",
      status: "PENDING",
      message: "Analysis started",
    };
    
    vi.mocked(analyzeTextApi.analyzeText).mockResolvedValue(mockResponse);
    
    render(<AnalyzeTextForm />);
    
    const textarea = screen.getByPlaceholderText(/Paste any text about a company/);
    fireEvent.change(textarea, { target: { value: "AAPL is great" } });
    
    const analyzeButton = screen.getByRole("button", { name: /Analyze/i });
    fireEvent.click(analyzeButton);
    
    await waitFor(() => {
      expect(screen.getByText("Analysis Started!")).toBeInTheDocument();
      expect(screen.getByText(/Your text is being analyzed by AI/)).toBeInTheDocument();
    });
    
    const viewInQueueButton = screen.getByRole("button", { name: /View in queue/i });
    expect(viewInQueueButton).toBeInTheDocument();
    
    fireEvent.click(viewInQueueButton);
    expect(mockPush).toHaveBeenCalledWith("/jobs");
  });

  it("shows loading state during analysis", async () => {
    vi.mocked(analyzeTextApi.analyzeText).mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );
    
    render(<AnalyzeTextForm />);
    
    const textarea = screen.getByPlaceholderText(/Paste any text about a company/);
    fireEvent.change(textarea, { target: { value: "Test" } });
    
    const analyzeButton = screen.getByRole("button", { name: /Analyze/i });
    fireEvent.click(analyzeButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Analyzing\.\.\./)).toBeInTheDocument();
    });
  });
});
