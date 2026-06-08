import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

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

const SELECT =
  "id, party_name, mobile, address, opening_fine, opening_amount, city, party_type, state, status, created_at";

export async function GET() {
  try {
    const result = await query<PartyRow>(`SELECT ${SELECT} FROM parties ORDER BY id`);
    return NextResponse.json(result.rows);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Query failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    if (!b.party_name || !b.city || !b.party_type || !b.state) {
      return NextResponse.json(
        { error: "Party name, city, party type and state are required" },
        { status: 400 },
      );
    }
    const result = await query<PartyRow>(
      `INSERT INTO parties
         (party_name, mobile, address, opening_fine, opening_amount, city, party_type, state)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING ${SELECT}`,
      [
        b.party_name,
        b.mobile ?? "",
        b.address ?? "",
        Number(b.opening_fine) || 0,
        Number(b.opening_amount) || 0,
        b.city,
        b.party_type,
        b.state,
      ],
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Query failed" }, { status: 500 });
  }
}
