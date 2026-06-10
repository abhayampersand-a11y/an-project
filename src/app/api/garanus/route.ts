import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

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

const SELECT =
  `id, to_char(inv_date, 'YYYY-MM-DD') AS inv_date, party, items, m_touch, m_touch2, copper_t,
   fine, g_weight, total_f, garanu, final_copper, details, remark, created_at`;

export async function GET() {
  try {
    const result = await query<GaranuRow>(
      `SELECT ${SELECT} FROM garanus ORDER BY inv_date DESC, id DESC`,
    );
    return NextResponse.json(result.rows);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Query failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    if (!b.party || !b.inv_date) {
      return NextResponse.json({ error: "Party and date are required" }, { status: 400 });
    }
    const result = await query<GaranuRow>(
      `INSERT INTO garanus
        (inv_date, party, items, m_touch, m_touch2, copper_t, fine, g_weight, total_f,
         garanu, final_copper, details, remark)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING ${SELECT}`,
      [
        b.inv_date,
        b.party,
        JSON.stringify(Array.isArray(b.items) ? b.items : []),
        Number(b.m_touch) || 0,
        Number(b.m_touch2) || 0,
        Number(b.copper_t) || 0,
        Number(b.fine) || 0,
        Number(b.g_weight) || 0,
        Number(b.total_f) || 0,
        Number(b.garanu) || 0,
        Number(b.final_copper) || 0,
        JSON.stringify(b.details ?? {}),
        b.remark ?? "",
      ],
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Query failed" }, { status: 500 });
  }
}
