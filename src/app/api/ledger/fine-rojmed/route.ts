import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

type Entry = { date: string; fine: number; remark: string };
type PartyRow = { city: string | null };
type PayRow = { d: string; bill_type: string; fine: string };
type FineRow = { d: string; fine: string };

const n = (v: unknown) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const party = searchParams.get("party") ?? "";
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  if (!party) return NextResponse.json({ error: "Party is required" }, { status: 400 });

  try {
    const [partyRes, payRes, aavakRes, javakRes] = await Promise.all([
      query<PartyRow>("SELECT city FROM parties WHERE party_name=$1 LIMIT 1", [party]),
      query<PayRow>("SELECT to_char(pay_date,'YYYY-MM-DD') AS d, bill_type, fine FROM payments WHERE party=$1 AND fine <> 0", [party]),
      query<FineRow>("SELECT to_char(inv_date,'YYYY-MM-DD') AS d, fine FROM aavaks WHERE party=$1 AND fine <> 0", [party]),
      query<FineRow>("SELECT to_char(inv_date,'YYYY-MM-DD') AS d, fine FROM javaks WHERE party=$1 AND fine <> 0", [party]),
    ]);

    const city = partyRes.rows[0]?.city ?? "";
    const inPeriod = (d: string) => (!from || d >= from) && (!to || d <= to);

    // Fine is a daybook: one row per date, summed.
    const creditMap = new Map<string, number>();
    const debitMap = new Map<string, number>();
    const addTo = (map: Map<string, number>, d: string, fine: number) => {
      if (!inPeriod(d) || fine === 0) return;
      map.set(d, (map.get(d) ?? 0) + fine);
    };

    for (const p of payRes.rows) addTo(p.bill_type === "Debit" ? debitMap : creditMap, p.d, n(p.fine));
    for (const a of aavakRes.rows) addTo(creditMap, a.d, n(a.fine));
    for (const j of javakRes.rows) addTo(debitMap, j.d, n(j.fine));

    const toList = (map: Map<string, number>): Entry[] =>
      [...map.entries()]
        .map(([date, fine]) => ({ date, fine, remark: "" }))
        .sort((x, y) => x.date.localeCompare(y.date));

    const credit = toList(creditMap);
    const debit = toList(debitMap);
    const creditTotal = credit.reduce((s, e) => s + e.fine, 0);
    const debitTotal = debit.reduce((s, e) => s + e.fine, 0);
    const closing = creditTotal - debitTotal;

    return NextResponse.json({ party, city, from, to, credit, debit, creditTotal, debitTotal, closing });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Query failed" }, { status: 500 });
  }
}
