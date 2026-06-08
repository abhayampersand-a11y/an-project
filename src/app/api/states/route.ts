import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await query<{
      id: number; state_name: string; state_code: string;
      country: string; status: string; created_at: string;
    }>("SELECT id, state_name, state_code, country, status, created_at FROM states ORDER BY id");
    return NextResponse.json(result.rows);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Query failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { state_name, state_code, country } = await req.json();
    if (!state_name || !country) {
      return NextResponse.json({ error: "State name and country are required" }, { status: 400 });
    }
    const result = await query<{ id: number; state_name: string; state_code: string; country: string; status: string; created_at: string }>(
      `INSERT INTO states (state_name, state_code, country)
       VALUES ($1, $2, $3)
       RETURNING id, state_name, state_code, country, status, created_at`,
      [state_name, state_code ?? "", country],
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Query failed" }, { status: 500 });
  }
}
