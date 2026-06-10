import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

// Returns a party's latest closing balance across the whole ledger
// (Aavak + Javak combined), used to seed the "previous" amount/fine on the
// next entry of any type. Whichever transaction is most recent wins.
export async function GET(req: NextRequest) {
  try {
    const party = req.nextUrl.searchParams.get("party");
    if (!party) {
      return NextResponse.json({ error: "party is required" }, { status: 400 });
    }
    const r = await query<{ closing_amount: string; closing_fine: string }>(
      `SELECT closing_amount, closing_fine FROM (
         SELECT inv_date, id, closing_amount, closing_fine FROM aavaks WHERE party = $1
         UNION ALL
         SELECT inv_date, id, closing_amount, closing_fine FROM javaks WHERE party = $1
       ) t
       ORDER BY inv_date DESC, id DESC
       LIMIT 1`,
      [party],
    );
    const row = r.rows[0];
    return NextResponse.json({
      previous_amount: Number(row?.closing_amount) || 0,
      previous_fine: Number(row?.closing_fine) || 0,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Query failed" },
      { status: 500 },
    );
  }
}
