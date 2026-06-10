import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

const SELECT =
  `id, to_char(inv_date, 'YYYY-MM-DD') AS inv_date, invoice_no, party, items, fine, amount,
   roundoff_fine, roundoff_amount, previous_amount, previous_fine, closing_amount, closing_fine,
   remark, created_at`;

type AavakRow = {
  id: number;
  inv_date: string;
  invoice_no: string;
  party: string;
  items: unknown;
  fine: string;
  amount: string;
  roundoff_fine: string;
  roundoff_amount: string;
  previous_amount: string;
  previous_fine: string;
  closing_amount: string;
  closing_fine: string;
  remark: string | null;
  created_at: string;
};

const SCALAR_COLUMNS = [
  "inv_date", "invoice_no", "party", "fine", "amount",
  "roundoff_fine", "roundoff_amount", "previous_amount", "previous_fine",
  "closing_amount", "closing_fine", "remark",
] as const;
const NUMERIC_COLUMNS = new Set([
  "fine", "amount", "roundoff_fine", "roundoff_amount",
  "previous_amount", "previous_fine", "closing_amount", "closing_fine",
]);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (isNaN(Number(id))) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  try {
    const result = await query<AavakRow>(`SELECT ${SELECT} FROM aavaks WHERE id=$1`, [id]);
    if (!result.rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(result.rows[0]);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Query failed" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (isNaN(Number(id))) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    const body = await req.json();
    const fields: string[] = [];
    const values: unknown[] = [];
    let i = 1;

    for (const col of SCALAR_COLUMNS) {
      if (body[col] !== undefined) {
        fields.push(`${col}=$${i++}`);
        values.push(NUMERIC_COLUMNS.has(col) ? Number(body[col]) || 0 : body[col]);
      }
    }
    if (body.items !== undefined) {
      fields.push(`items=$${i++}`);
      values.push(JSON.stringify(Array.isArray(body.items) ? body.items : []));
    }

    if (!fields.length) return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    values.push(id);

    const result = await query<AavakRow>(
      `UPDATE aavaks SET ${fields.join(", ")} WHERE id=$${i} RETURNING ${SELECT}`,
      values,
    );
    if (!result.rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(result.rows[0]);
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
    const result = await query<{ id: number }>("DELETE FROM aavaks WHERE id=$1 RETURNING id", [id]);
    if (!result.rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ message: "Deleted", id: result.rows[0].id });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Query failed" }, { status: 500 });
  }
}
