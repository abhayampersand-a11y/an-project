import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

type Entry = { account: string; rs: number; remark: string };
type PayRow = { d: string; party: string; bill_type: string; rs: string; remark: string | null };

const n = (v: unknown) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? "";
  if (!date) return NextResponse.json({ error: "Date is required" }, { status: 400 });

  try {
    // RS daybook is payments-only (cash in / out).
    const payRes = await query<PayRow>(
      "SELECT to_char(pay_date,'YYYY-MM-DD') AS d, party, bill_type, rs, remark FROM payments WHERE rs <> 0",
      [],
    );

    let openCredit = 0;
    let openDebit = 0;
    const dayCredit = new Map<string, { rs: number; remarks: Set<string> }>();
    const dayDebit = new Map<string, { rs: number; remarks: Set<string> }>();

    for (const p of payRes.rows) {
      const side = p.bill_type === "Debit" ? "debit" : "credit";
      const rs = n(p.rs);
      if (rs === 0) continue;
      if (p.d < date) {
        if (side === "credit") openCredit += rs; else openDebit += rs;
      } else if (p.d === date) {
        const map = side === "credit" ? dayCredit : dayDebit;
        const cur = map.get(p.party) ?? { rs: 0, remarks: new Set<string>() };
        cur.rs += rs;
        if (p.remark) cur.remarks.add(p.remark);
        map.set(p.party, cur);
      }
    }

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
