import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

type FinancialYearRow = {
  id: number;
  label: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
};

/** Create the table on first use so no manual migration is needed. */
async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS financial_years (
      id SERIAL PRIMARY KEY,
      label TEXT NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

// Select with dates cast to plain YYYY-MM-DD strings to avoid timezone shifts.
const SELECT = `
  SELECT id, label,
         to_char(start_date, 'YYYY-MM-DD') AS start_date,
         to_char(end_date,   'YYYY-MM-DD') AS end_date,
         is_active, created_at
  FROM financial_years`;

export async function GET() {
  try {
    await ensureTable();
    const r = await query<FinancialYearRow>(`${SELECT} ORDER BY start_date DESC`);
    return NextResponse.json(r.rows);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Query failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureTable();
    const { label, start_date, end_date, is_active } = await req.json();
    if (!label?.trim() || !start_date || !end_date) {
      return NextResponse.json({ error: "Label, start date and end date are required" }, { status: 400 });
    }
    if (start_date > end_date) {
      return NextResponse.json({ error: "Start date must be on or before end date" }, { status: 400 });
    }
    // Only one year can be active: clear the others first.
    if (is_active) await query("UPDATE financial_years SET is_active = false WHERE is_active = true");
    const r = await query<FinancialYearRow>(
      `INSERT INTO financial_years (label, start_date, end_date, is_active)
       VALUES ($1, $2, $3, $4)
       RETURNING id, label, to_char(start_date,'YYYY-MM-DD') AS start_date,
                 to_char(end_date,'YYYY-MM-DD') AS end_date, is_active, created_at`,
      [label.trim(), start_date, end_date, Boolean(is_active)],
    );
    return NextResponse.json(r.rows[0], { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Query failed" }, { status: 500 });
  }
}
