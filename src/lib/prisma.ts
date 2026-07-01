// Disabled until Neon database is configured
// Run: npx prisma generate after setting DATABASE_URL in .env.local

/*
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
*/

// Temporary mock for type safety (remove when database is ready)
export const prisma = null as any;
