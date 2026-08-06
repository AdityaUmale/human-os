import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import type { PoolConfig } from "pg";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:5432/postgres";

/**
 * Vercel can run several route instances at once. Keep each pg pool small so
 * one warm instance cannot consume Supabase's entire session-pool allowance.
 * Set PG_POOL_MAX explicitly when using a database with a larger allowance.
 */
export function getPgPoolConfig(connectionString: string = databaseUrl): PoolConfig {
  const configuredMax = Number.parseInt(process.env.PG_POOL_MAX ?? "", 10);
  const max = Number.isInteger(configuredMax) && configuredMax > 0 ? configuredMax : 1;

  return {
    connectionString,
    max,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  };
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg(getPgPoolConfig()),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

// Reuse the client in development and in warm serverless instances alike.
globalForPrisma.prisma = prisma;
