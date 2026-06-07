import "server-only";
import { Pool } from "pg";

/**
 * Shared Postgres connection pool.
 *
 * Reads the connection string from env. Vercel Postgres / Neon expose several
 * names; we accept the common ones. The same connection string also works in
 * pgAdmin (right-click Servers → Register → Server → Connection tab).
 *
 * In dev we cache the pool on `globalThis` so hot-reload doesn't open a new
 * pool on every change.
 */
const connectionString =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_URL ??
  process.env.POSTGRES_PRISMA_URL;

const globalForDb = globalThis as unknown as { _pgPool?: Pool };

export const pool =
  globalForDb._pgPool ??
  new Pool({
    connectionString,
    // Hosted Postgres (Vercel/Neon/Supabase) requires SSL.
    ssl: connectionString?.includes("localhost")
      ? false
      : { rejectUnauthorized: false },
    max: 5,
  });

if (process.env.NODE_ENV !== "production") globalForDb._pgPool = pool;

/** Run a parameterized query. */
export async function query<T extends Record<string, unknown>>(
  text: string,
  params?: unknown[],
) {
  return pool.query<T>(text, params);
}
