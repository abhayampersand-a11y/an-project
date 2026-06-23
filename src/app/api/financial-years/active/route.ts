import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

type FinancialYearRow = {
  id: number;
  label: string;
  start_date: string;
  end_date: string;
};

/** Returns the currently active financial year, or null if none is set. */
export async function GET() {
  try {
    const r = await query<FinancialYearRow>(
      `SELECT id, label,
              to_char(start_date,'YYYY-MM-DD') AS start_date,
              to_char(end_date,'YYYY-MM-DD')   AS end_date
       FROM financial_years
       WHERE is_active = true
       ORDER BY start_date DESC
       LIMIT 1`,
    );
    return NextResponse.json(r.rows[0] ?? null);
  } catch {
    // Table may not exist yet — treat as "no active year" rather than erroring.
    return NextResponse.json(null);
  }
}
