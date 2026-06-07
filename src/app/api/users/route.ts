import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/users — list all users
export async function GET() {
  try {
    const result = await query<{
      id: number;
      name: string;
      email: string;
      role: string;
      status: string;
      created_at: string;
    }>("SELECT id, name, email, role, status, created_at FROM users ORDER BY id");
    return NextResponse.json(result.rows);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Query failed" },
      { status: 500 },
    );
  }
}

// POST /api/users — create a user
// Body: { name, email, role?, status? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, role = "User", status = "Active" } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "name and email are required" },
        { status: 400 },
      );
    }

    const result = await query<{
      id: number;
      name: string;
      email: string;
      role: string;
      status: string;
      created_at: string;
    }>(
      `INSERT INTO users (name, email, role, status)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, status, created_at`,
      [name, email, role, status],
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Query failed";
    if (msg.includes("unique")) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
