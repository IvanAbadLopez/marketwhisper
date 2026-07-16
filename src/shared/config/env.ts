/**
 * Environment variables with type safety
 * @module shared/config
 */

function getEnvVar(key: string, defaultValue?: string): string {
  // In browser/client, process.env may not be available or may be empty
  // Only throw errors on server-side (where process.env is populated)
  if (typeof window !== 'undefined') {
    // Client-side: return empty string or default, never throw
    return defaultValue || "";
  }
  
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || defaultValue || "";
}

function getOptionalEnvVar(key: string): string | undefined {
  if (typeof window !== 'undefined') {
    // Client-side: always undefined
    return undefined;
  }
  return process.env[key];
}

export const env = {
  // Database
  DATABASE_URL: getEnvVar("DATABASE_URL"),

  // NextAuth
  NEXTAUTH_URL: getEnvVar("NEXTAUTH_URL", "http://localhost:3000"),
  NEXTAUTH_SECRET: getEnvVar("NEXTAUTH_SECRET"),

  // OAuth (optional)
  GOOGLE_CLIENT_ID: getOptionalEnvVar("GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: getOptionalEnvVar("GOOGLE_CLIENT_SECRET"),
  GITHUB_CLIENT_ID: getOptionalEnvVar("GITHUB_CLIENT_ID"),
  GITHUB_CLIENT_SECRET: getOptionalEnvVar("GITHUB_CLIENT_SECRET"),

  // Financial Data APIs
  FINNHUB_API_KEY: getOptionalEnvVar("FINNHUB_API_KEY"),

  // LLM Provider (Groq only for serverless deployment)
  GROQ_API_KEY: getOptionalEnvVar("GROQ_API_KEY"),
  GROQ_MODEL: getEnvVar("GROQ_MODEL", "llama-3.3-70b-versatile"),

  // Node Environment
  NODE_ENV: getEnvVar("NODE_ENV", "development"),

  // Feature Flags
  IS_PRODUCTION: process.env.NODE_ENV === "production",
  IS_DEVELOPMENT: process.env.NODE_ENV === "development",
  IS_TEST: process.env.NODE_ENV === "test",

  // Helper: Get current AI model name
  getCurrentModel(): string {
    return this.GROQ_MODEL;
  },
} as const;
