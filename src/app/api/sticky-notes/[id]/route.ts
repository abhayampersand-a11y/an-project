import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

type StickyRow = {
  id: number;
  party_name: string;
  content: string | null;
  created_at: string;
};

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (isNaN(Number(id))) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  try {
    const b = await req.json();
    if (!b.party_name?.trim()) {
      return NextResponse.json({ error: "Party name is required" }, { status: 400 });
    }
    const r = await query<StickyRow>(
      `UPDATE sticky_notes SET party_name = $1, content = $2 WHERE id = $3
       RETURNING id, party_name, content, created_at`,
      [b.party_name, b.content ?? "", id],
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
    await query("DELETE FROM sticky_notes WHERE id = $1", [id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Query failed" }, { status: 500 });
  }
}
