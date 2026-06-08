import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await query<{
      id: number; item_name: string; status: string; created_at: string;
    }>("SELECT id, item_name, status, created_at FROM items ORDER BY id");
    return NextResponse.json(result.rows);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Query failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { item_name } = await req.json();
    if (!item_name) {
      return NextResponse.json({ error: "Item name is required" }, { status: 400 });
    }
    const result = await query<{ id: number; item_name: string; status: string; created_at: string }>(
      `INSERT INTO items (item_name)
       VALUES ($1)
       RETURNING id, item_name, status, created_at`,
      [item_name],
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Query failed" }, { status: 500 });
  }
}
