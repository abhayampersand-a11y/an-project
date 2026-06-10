import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

type Entry = { date: string; rs: number; remark: string };
type PartyRow = { city: string | null };
type PayRow = { d: string; bill_type: string; rs: string; remark: string | null };

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
    const [partyRes, payRes] = await Promise.all([
      query<PartyRow>("SELECT city FROM parties WHERE party_name=$1 LIMIT 1", [party]),
      query<PayRow>(
        "SELECT to_char(pay_date,'YYYY-MM-DD') AS d, bill_type, rs, remark FROM payments WHERE party=$1 AND rs <> 0",
        [party],
      ),
    ]);

    const city = partyRes.rows[0]?.city ?? "";
    const inPeriod = (d: string) => (!from || d >= from) && (!to || d <= to);

    const credit: Entry[] = [];
    const debit: Entry[] = [];
    for (const p of payRes.rows) {
      if (!inPeriod(p.d)) continue;
      const e = { date: p.d, rs: n(p.rs), remark: p.remark ?? "" };
      (p.bill_type === "Debit" ? debit : credit).push(e);
    }

    credit.sort((a, b) => a.date.localeCompare(b.date));
    debit.sort((a, b) => a.date.localeCompare(b.date));

    const sum = (arr: Entry[]) => arr.reduce((s, e) => s + e.rs, 0);
    const creditTotal = sum(credit);
    const debitTotal = sum(debit);
    const closing = creditTotal - debitTotal;

    return NextResponse.json({ party, city, from, to, credit, debit, creditTotal, debitTotal, closing });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Query failed" }, { status: 500 });
  }
}
