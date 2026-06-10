import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

const SELECT =
  `id, to_char(inv_date, 'YYYY-MM-DD') AS inv_date, party, items, m_touch, m_touch2, copper_t,
   fine, g_weight, total_f, garanu, final_copper, details, remark, created_at`;

type GaranuRow = {
  id: number;
  inv_date: string;
  party: string;
  items: unknown;
  m_touch: string;
  m_touch2: string;
  copper_t: string;
  fine: string;
  g_weight: string;
  total_f: string;
  garanu: string;
  final_copper: string;
  details: unknown;
  remark: string | null;
  created_at: string;
};

const SCALAR_COLUMNS = [
  "inv_date", "party", "m_touch", "m_touch2", "copper_t",
  "fine", "g_weight", "total_f", "garanu", "final_copper", "remark",
] as const;
const NUMERIC_COLUMNS = new Set([
  "m_touch", "m_touch2", "copper_t", "fine", "g_weight", "total_f", "garanu", "final_copper",
]);
const JSON_COLUMNS = ["items", "details"] as const;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (isNaN(Number(id))) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  try {
    const result = await query<GaranuRow>(`SELECT ${SELECT} FROM garanus WHERE id=$1`, [id]);
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
        values.push(JSON.stringify(col === "items" ? (Array.isArray(body[col]) ? body[col] : []) : (body[col] ?? {})));
      }
    }

    if (!fields.length) return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    values.push(id);

    const result = await query<GaranuRow>(
      `UPDATE garanus SET ${fields.join(", ")} WHERE id=$${i} RETURNING ${SELECT}`,
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
    const result = await query<{ id: number }>("DELETE FROM garanus WHERE id=$1 RETURNING id", [id]);
    if (!result.rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ message: "Deleted", id: result.rows[0].id });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Query failed" }, { status: 500 });
  }
}
