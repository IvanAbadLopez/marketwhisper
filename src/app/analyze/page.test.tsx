import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import AnalyzePage from "./page";

// Mock auth
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(() => Promise.resolve({
    user: { id: "test-id", name: "Test User", email: "test@test.com" }
  }))
}));

// Mock next-auth/react
vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  usePathname: vi.fn(() => "/analyze"),
}));

// Mock next-intl (required by layout/components)
vi.mock("next-intl", () => ({
  useLocale: vi.fn(() => 'en'),
  useTranslations: vi.fn(() => (key: string) => key),
}));

vi.mock("next-intl/server", () => ({
  getLocale: vi.fn(() => Promise.resolve('en')),
  getMessages: vi.fn(() => Promise.resolve({})),
  getTranslations: vi.fn(() => Promise.resolve((key: string) => {
    const translations: Record<string, string> = {
      'title': 'AI Text Analysis',
      'subtitle': 'Paste any text about companies or stocks to get AI-powered sentiment analysis and reliability scores',
    };
    return translations[key] || key;
  })),
}));

// Mock LocaleSwitcher feature
vi.mock("@/features/switch-locale", () => ({
  LocaleSwitcher: () => <div data-testid="locale-switcher">EN | ES</div>,
}));

// Mock AnalyzeTextForm
vi.mock("@/features/analyze-text", () => ({
  AnalyzeTextForm: () => <div data-testid="analyze-form">Analyze Form</div>
}));

describe("Analyze Page", () => {
  it("renders page title and description", async () => {
    const page = await AnalyzePage();
    render(page);
    
    expect(screen.getByText("AI Text Analysis")).toBeInTheDocument();
    expect(screen.getByText(/Paste any text about companies or stocks/)).toBeInTheDocument();
  });

  it("renders AnalyzeTextForm component", async () => {
    const page = await AnalyzePage();
    render(page);
    
    expect(screen.getByTestId("analyze-form")).toBeInTheDocument();
  });
});
