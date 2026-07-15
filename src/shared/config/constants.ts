/**
 * Application-wide constants
 * @module shared/config
 */

export const APP_NAME = "MarketWhisper" as const;

export const APP_DESCRIPTION =
  "AI-Powered Market Intelligence Platform" as const;

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  COMPANIES: "/companies",
  COMPANY_DETAIL: (ticker: string) => `/companies/${ticker}`,
  SITUATIONS: "/situations",
  VIDEOS: "/videos",
  SEARCH: "/search",
  NEWS: "/news",
  CHAT: "/chat",
  DEBUG: "/debug",
} as const;

export const API_ROUTES = {
  AUTH: {
    NEXT_AUTH: "/api/auth",
    REGISTER: "/api/auth/register",
  },
  ANALYZE: "/api/analyze",
  COMPANIES: "/api/companies",
  COMPANY_DETAIL: (ticker: string) => `/api/companies/${ticker}`,
  NEWS: "/api/news",
  CONTENT: "/api/content",
  CONTENT_DETAIL: (id: string) => `/api/content/${id}`,
} as const;

export const SENTIMENT = {
  BULLISH: "BULLISH",
  BEARISH: "BEARISH",
  NEUTRAL: "NEUTRAL",
} as const;

export const SENTIMENT_COLORS = {
  BULLISH: "text-green-600 dark:text-green-400",
  BEARISH: "text-red-600 dark:text-red-400",
  NEUTRAL: "text-gray-600 dark:text-gray-400",
} as const;

export const SENTIMENT_BG_COLORS = {
  BULLISH: "bg-green-100 dark:bg-green-900/20",
  BEARISH: "bg-red-100 dark:bg-red-900/20",
  NEUTRAL: "bg-gray-100 dark:bg-gray-900/20",
} as const;

export const RELIABILITY_THRESHOLDS = {
  HIGH: 8,
  MEDIUM: 5,
  LOW: 0,
} as const;

export const DEMO_USER = {
  EMAIL: "demo@marketwhisper.com",
  PASSWORD: "MarketWhisper2026!",
} as const;

export const MARKET_CAP_UNITS = {
  TRILLION: 1_000_000_000_000,
  BILLION: 1_000_000_000,
  MILLION: 1_000_000,
} as const;
