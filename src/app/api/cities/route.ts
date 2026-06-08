import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await query<{
      id: number; city_name: string; city_code: string;
      status: string; created_at: string;
    }>("SELECT id, city_name, city_code, status, created_at FROM cities ORDER BY id");
    return NextResponse.json(result.rows);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Query failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { city_name, city_code } = await req.json();
    if (!city_name) {
      return NextResponse.json({ error: "City name is required" }, { status: 400 });
    }
    const result = await query<{ id: number; city_name: string; city_code: string; status: string; created_at: string }>(
      `INSERT INTO cities (city_name, city_code)
       VALUES ($1, $2)
       RETURNING id, city_name, city_code, status, created_at`,
      [city_name, city_code ?? ""],
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Query failed" }, { status: 500 });
  }
}
