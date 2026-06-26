import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

const n = (v: unknown) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

// Returns a party's running balance across the whole ledger, used to seed the
// "previous" amount/fine on an entry of any type.
//
// The balance is computed the same way the ledger reports do it: the party's
// opening fine/amount sit on the debit side, Aavak adds credit, Javak and
// Debit payments add debit, Credit payments add credit. The result is the
// signed running balance (credit − debit): positive → cr, negative → dr.
// Seeding from this — rather than the last entry's stored closing — keeps the
// opening balance in play even before the party has any Aavak/Javak history.
//
// Pass `before=YYYY-MM-DD` to count only transactions dated strictly earlier,
// i.e. the balance the party carried *into* an entry on that date. Editing an
// existing entry uses this with the entry's own date so its "previous" reflects
// the opening balance plus everything before it (and never the entry itself).
export async function GET(req: NextRequest) {
  try {
    const party = req.nextUrl.searchParams.get("party");
    if (!party) {
      return NextResponse.json({ error: "party is required" }, { status: 400 });
    }
    const before = req.nextUrl.searchParams.get("before"); // YYYY-MM-DD, exclusive

    // Optional date guard: only transactions dated strictly before `before`.
    const pp: (string | null)[] = [party];
    let datePay = "";
    let dateInv = "";
    if (before) {
      pp.push(before);
      datePay = " AND pay_date < $2";
      dateInv = " AND inv_date < $2";
    }

    const [partyRes, payRes, aavakRes, javakRes] = await Promise.all([
      query<{ opening_fine: string; opening_amount: string }>(
        "SELECT opening_fine, opening_amount FROM parties WHERE party_name=$1 LIMIT 1",
        [party],
      ),
      query<{ bill_type: string; fine: string; rs: string }>(
        `SELECT bill_type, fine, rs FROM payments WHERE party=$1${datePay}`,
        pp,
      ),
      query<{ fine: string; amount: string }>(
        `SELECT fine, amount FROM aavaks WHERE party=$1${dateInv}`,
        pp,
      ),
      query<{ fine: string; labour: string }>(
        `SELECT fine, labour FROM javaks WHERE party=$1${dateInv}`,
        pp,
      ),
    ]);

    // Opening balance starts on the debit side (party owes at start).
    let fine = -n(partyRes.rows[0]?.opening_fine);
    let amount = -n(partyRes.rows[0]?.opening_amount);

    for (const p of payRes.rows) {
      const sign = p.bill_type === "Debit" ? -1 : 1;
      fine += sign * n(p.fine);
      amount += sign * n(p.rs);
    }
    for (const a of aavakRes.rows) {
      fine += n(a.fine);
      amount += n(a.amount);
    }
    for (const j of javakRes.rows) {
      fine -= n(j.fine);
      amount -= n(j.labour);
    }

    return NextResponse.json({
      previous_amount: amount,
      previous_fine: fine,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Query failed" },
      { status: 500 },
    );
  }
}
