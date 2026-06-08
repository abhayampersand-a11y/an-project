import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

const SELECT =
  "id, party_name, mobile, address, opening_fine, opening_amount, city, party_type, state, status, created_at";

type PartyRow = {
  id: number;
  party_name: string;
  mobile: string | null;
  address: string | null;
  opening_fine: string;
  opening_amount: string;
  city: string | null;
  party_type: string;
  state: string | null;
  status: string;
  created_at: string;
};

const COLUMNS = [
  "party_name",
  "mobile",
  "address",
  "opening_fine",
  "opening_amount",
  "city",
  "party_type",
  "state",
  "status",
] as const;

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

    for (const col of COLUMNS) {
      if (body[col] !== undefined) {
        fields.push(`${col}=$${i++}`);
        if (col === "opening_fine" || col === "opening_amount") {
          values.push(Number(body[col]) || 0);
        } else {
          values.push(body[col]);
        }
      }
    }

    if (!fields.length) return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    values.push(id);

    const result = await query<PartyRow>(
      `UPDATE parties SET ${fields.join(", ")} WHERE id=$${i} RETURNING ${SELECT}`,
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
    const result = await query<{ id: number }>("DELETE FROM parties WHERE id=$1 RETURNING id", [id]);
    if (!result.rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ message: "Deleted", id: result.rows[0].id });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Query failed" }, { status: 500 });
  }
}
