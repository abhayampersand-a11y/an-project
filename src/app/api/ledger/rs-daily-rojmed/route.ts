import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

type Entry = { account: string; rs: number; remark: string };
type PayRow = { d: string; party: string; bill_type: string; rs: string; remark: string | null };
type AavakRow = { d: string; party: string; amount: string; remark: string | null };

const n = (v: unknown) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? "";
  if (!date) return NextResponse.json({ error: "Date is required" }, { status: 400 });

  try {
    // RS daybook: payments (cash in / out) on both sides, plus invoice aavak
    // (amount) on the credit side only. Invoice javak is intentionally excluded.
    const [payRes, aavakRes] = await Promise.all([
      query<PayRow>(
        "SELECT to_char(pay_date,'YYYY-MM-DD') AS d, party, bill_type, rs, remark FROM payments WHERE rs <> 0",
        [],
      ),
      query<AavakRow>(
        "SELECT to_char(inv_date,'YYYY-MM-DD') AS d, party, amount, remark FROM aavaks WHERE amount <> 0",
        [],
      ),
    ]);

    let openCredit = 0;
    let openDebit = 0;
    const dayCredit = new Map<string, { rs: number; remarks: Set<string> }>();
    const dayDebit = new Map<string, { rs: number; remarks: Set<string> }>();

    function handle(side: "credit" | "debit", d: string, party: string, rs: number, remark: string) {
      if (rs === 0) return;
      if (d < date) {
        if (side === "credit") openCredit += rs; else openDebit += rs;
      } else if (d === date) {
        const map = side === "credit" ? dayCredit : dayDebit;
        const cur = map.get(party) ?? { rs: 0, remarks: new Set<string>() };
        cur.rs += rs;
        if (remark) cur.remarks.add(remark);
        map.set(party, cur);
      }
    }

    for (const p of payRes.rows) handle(p.bill_type === "Debit" ? "debit" : "credit", p.d, p.party, n(p.rs), p.remark ?? "");
    for (const a of aavakRes.rows) handle("credit", a.d, a.party, n(a.amount), a.remark ?? "");

    const toList = (map: Map<string, { rs: number; remarks: Set<string> }>): Entry[] =>
      [...map.entries()]
        .map(([account, v]) => ({ account, rs: v.rs, remark: [...v.remarks].join(" / ") }))
        .sort((a, b) => b.rs - a.rs);

    const credit = toList(dayCredit);
    const debit = toList(dayDebit);
    const opening = openCredit - openDebit;
    const creditTotal = credit.reduce((s, e) => s + e.rs, 0);
    const debitTotal = debit.reduce((s, e) => s + e.rs, 0);
    const closing = opening + creditTotal - debitTotal;

    return NextResponse.json({
      date,
      opening,
      openingLabel: opening >= 0 ? "cr" : "db",
      credit,
      debit,
      creditTotal,
      debitTotal,
      closing,
      closingLabel: closing >= 0 ? "cr" : "db",
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Query failed" }, { status: 500 });
  }
}
