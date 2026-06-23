import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

type FinancialYearRow = {
  id: number;
  label: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
};

const RETURNING = `RETURNING id, label,
  to_char(start_date,'YYYY-MM-DD') AS start_date,
  to_char(end_date,'YYYY-MM-DD') AS end_date,
  is_active, created_at`;

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (isNaN(Number(id))) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    const { label, start_date, end_date, is_active } = await req.json();

    if (start_date !== undefined && end_date !== undefined && start_date > end_date) {
      return NextResponse.json({ error: "Start date must be on or before end date" }, { status: 400 });
    }

    // Activating this year deactivates every other one.
    if (is_active === true) {
      await query("UPDATE financial_years SET is_active = false WHERE id <> $1", [id]);
    }

    const fields: string[] = [];
    const values: unknown[] = [];
    let i = 1;
    if (label      !== undefined) { fields.push(`label=$${i++}`);      values.push(label); }
    if (start_date !== undefined) { fields.push(`start_date=$${i++}`); values.push(start_date); }
    if (end_date   !== undefined) { fields.push(`end_date=$${i++}`);   values.push(end_date); }
    if (is_active  !== undefined) { fields.push(`is_active=$${i++}`);  values.push(Boolean(is_active)); }

    if (!fields.length) return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    values.push(id);

    const r = await query<FinancialYearRow>(
      `UPDATE financial_years SET ${fields.join(", ")} WHERE id=$${i} ${RETURNING}`,
      values,
    );
    if (!r.rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(r.rows[0]);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Query failed" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (isNaN(Number(id))) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    const r = await query<{ id: number }>("DELETE FROM financial_years WHERE id=$1 RETURNING id", [id]);
    if (!r.rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ message: "Deleted", id: r.rows[0].id });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Query failed" }, { status: 500 });
  }
}
