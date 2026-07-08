import "@testing-library/jest-dom/vitest";

// Set required environment variables for tests
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.NEXTAUTH_URL = "http://localhost:3000";
process.env.NEXTAUTH_SECRET = "test-secret";
process.env.OLLAMA_URL = "http://localhost:11434";
process.env.ENRICHMENT_SERVICE_URL = "http://localhost:8001";
