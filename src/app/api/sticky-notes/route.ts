import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

type StickyRow = {
  id: number;
  party_name: string;
  content: string | null;
  created_at: string;
};

export async function GET() {
  try {
    const r = await query<StickyRow>(
      "SELECT id, party_name, content, created_at FROM sticky_notes ORDER BY id DESC",
    );
    return NextResponse.json(r.rows);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Query failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    if (!b.party_name?.trim()) {
      return NextResponse.json({ error: "Party name is required" }, { status: 400 });
    }
    const r = await query<StickyRow>(
      `INSERT INTO sticky_notes (party_name, content) VALUES ($1, $2)
       RETURNING id, party_name, content, created_at`,
      [b.party_name, b.content ?? ""],
    );
    return NextResponse.json(r.rows[0], { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Query failed" }, { status: 500 });
  }
}
