import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (isNaN(Number(id))) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    const body = await req.json();
    const { item_name, status } = body;

    const fields: string[] = [];
    const values: unknown[] = [];
    let i = 1;
    if (item_name !== undefined) { fields.push(`item_name=$${i++}`); values.push(item_name); }
    if (status    !== undefined) { fields.push(`status=$${i++}`);    values.push(status); }

    if (!fields.length) return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    values.push(id);

    const result = await query<{ id: number; item_name: string; status: string; created_at: string }>(
      `UPDATE items SET ${fields.join(", ")} WHERE id=$${i} RETURNING id, item_name, status, created_at`,
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
    const result = await query<{ id: number }>("DELETE FROM items WHERE id=$1 RETURNING id", [id]);
    if (!result.rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ message: "Deleted", id: result.rows[0].id });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Query failed" }, { status: 500 });
  }
}
