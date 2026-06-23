import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

type YearRange = { start_date: string; end_date: string };

// Returns the next Aavak number scoped to the active financial year:
// highest numeric value seen within that year + 1 (so numbering restarts at 1
// each new financial year). Falls back to all invoices when no year is active.
export async function GET() {
  try {
    const fy = await query<YearRange>(
      `SELECT to_char(start_date,'YYYY-MM-DD') AS start_date,
              to_char(end_date,'YYYY-MM-DD')   AS end_date
       FROM financial_years
       WHERE is_active = true
       ORDER BY start_date DESC
       LIMIT 1`,
    ).catch(() => ({ rows: [] as YearRange[] }));

    const year = fy.rows[0];
    const r = year
      ? await query<{ invoice_no: string }>(
          "SELECT invoice_no FROM aavaks WHERE inv_date BETWEEN $1 AND $2",
          [year.start_date, year.end_date],
        )
      : await query<{ invoice_no: string }>("SELECT invoice_no FROM aavaks");

    let max = 0;
    for (const row of r.rows) {
      const m = /(\d+)\s*$/.exec(row.invoice_no ?? "");
      if (m) max = Math.max(max, Number(m[1]));
    }
    return NextResponse.json({ invoice_no: String(max + 1) });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Query failed" }, { status: 500 });
  }
}
