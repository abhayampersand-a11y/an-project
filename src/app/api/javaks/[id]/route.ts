import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

const SELECT =
  `id, type, bill_type, to_char(inv_date, 'YYYY-MM-DD') AS inv_date, invoice_no, party,
   bags, items, fine, labour, previous_amount, previous_fine, closing_amount, closing_fine,
   remark, created_at`;

type JavakRow = {
  id: number;
  type: string;
  bill_type: string;
  inv_date: string;
  invoice_no: string;
  party: string;
  bags: unknown;
  items: unknown;
  fine: string;
  labour: string;
  previous_amount: string;
  previous_fine: string;
  closing_amount: string;
  closing_fine: string;
  remark: string | null;
  created_at: string;
};

// Columns that may be updated. JSON columns are serialized before binding.
const SCALAR_COLUMNS = [
  "type", "bill_type", "inv_date", "invoice_no", "party",
  "fine", "labour", "previous_amount", "previous_fine",
  "closing_amount", "closing_fine", "remark",
] as const;
const NUMERIC_COLUMNS = new Set([
  "fine", "labour", "previous_amount", "previous_fine", "closing_amount", "closing_fine",
]);
const JSON_COLUMNS = ["bags", "items"] as const;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (isNaN(Number(id))) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  try {
    const result = await query<JavakRow>(`SELECT ${SELECT} FROM javaks WHERE id=$1`, [id]);
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
    for (const col of JSON_COLUMNS) {
      if (body[col] !== undefined) {
        fields.push(`${col}=$${i++}`);
        values.push(JSON.stringify(Array.isArray(body[col]) ? body[col] : []));
      }
    }

    if (!fields.length) return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    values.push(id);

    const result = await query<JavakRow>(
      `UPDATE javaks SET ${fields.join(", ")} WHERE id=$${i} RETURNING ${SELECT}`,
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
    const result = await query<{ id: number }>("DELETE FROM javaks WHERE id=$1 RETURNING id", [id]);
    if (!result.rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ message: "Deleted", id: result.rows[0].id });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Query failed" }, { status: 500 });
  }
}
