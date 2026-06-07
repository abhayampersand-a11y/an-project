import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// Never cache a health check.
export const dynamic = "force-dynamic";

/**
 * GET /api/db-health
 * Verifies the app can actually reach the Postgres database.
 * Returns the server time and version on success.
 */
export async function GET() {
  const hasConnString = Boolean(
    process.env.DATABASE_URL ??
      process.env.POSTGRES_URL ??
      process.env.POSTGRES_PRISMA_URL,
  );

  if (!hasConnString) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "No connection string set. Add DATABASE_URL (or POSTGRES_URL) to your env.",
      },
      { status: 503 },
    );
  }

  try {
    const result = await query<{ now: string; version: string }>(
      "SELECT now() AS now, version() AS version",
    );
    return NextResponse.json({ ok: true, ...result.rows[0] });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Query failed" },
      { status: 500 },
    );
  }
}
