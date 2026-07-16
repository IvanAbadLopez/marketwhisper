function getEnvVar(key: string, defaultValue?: string): string {
  if (typeof window !== 'undefined') {
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
    return undefined;
  }
  return process.env[key];
}

export const env = {
  DATABASE_URL: getEnvVar("DATABASE_URL"),

  NEXTAUTH_URL: getEnvVar("NEXTAUTH_URL", "http://localhost:3000"),
  NEXTAUTH_SECRET: getEnvVar("NEXTAUTH_SECRET"),

  GOOGLE_CLIENT_ID: getOptionalEnvVar("GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: getOptionalEnvVar("GOOGLE_CLIENT_SECRET"),
  GITHUB_CLIENT_ID: getOptionalEnvVar("GITHUB_CLIENT_ID"),
  GITHUB_CLIENT_SECRET: getOptionalEnvVar("GITHUB_CLIENT_SECRET"),

  FINNHUB_API_KEY: getOptionalEnvVar("FINNHUB_API_KEY"),

  GROQ_API_KEY: getOptionalEnvVar("GROQ_API_KEY"),
  GROQ_MODEL: getEnvVar("GROQ_MODEL", "llama-3.3-70b-versatile"),

  NODE_ENV: getEnvVar("NODE_ENV", "development"),

  IS_PRODUCTION: process.env.NODE_ENV === "production",
  IS_DEVELOPMENT: process.env.NODE_ENV === "development",
  IS_TEST: process.env.NODE_ENV === "test",

  getCurrentModel(): string {
    return this.GROQ_MODEL;
  },
} as const;
