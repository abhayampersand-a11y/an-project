import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

type Entry = { account: string; fine: number; remark: string };
type PayRow = { d: string; party: string; bill_type: string; fine: string; remark: string | null };
type FineRow = { d: string; party: string; fine: string; remark: string | null };

const n = (v: unknown) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? "";
  if (!date) return NextResponse.json({ error: "Date is required" }, { status: 400 });

  try {
    const [payRes, aavakRes, javakRes] = await Promise.all([
      query<PayRow>("SELECT to_char(pay_date,'YYYY-MM-DD') AS d, party, bill_type, fine, remark FROM payments WHERE fine <> 0", []),
      query<FineRow>("SELECT to_char(inv_date,'YYYY-MM-DD') AS d, party, fine, remark FROM aavaks WHERE fine <> 0", []),
      query<FineRow>("SELECT to_char(inv_date,'YYYY-MM-DD') AS d, party, fine, remark FROM javaks WHERE fine <> 0", []),
    ]);

    let openCredit = 0;
    let openDebit = 0;
    const dayCredit = new Map<string, { fine: number; remarks: Set<string> }>();
    const dayDebit = new Map<string, { fine: number; remarks: Set<string> }>();

    function handle(side: "credit" | "debit", d: string, party: string, fine: number, remark: string) {
      if (fine === 0) return;
      if (d < date) {
        if (side === "credit") openCredit += fine; else openDebit += fine;
      } else if (d === date) {
        const map = side === "credit" ? dayCredit : dayDebit;
        const cur = map.get(party) ?? { fine: 0, remarks: new Set<string>() };
        cur.fine += fine;
        if (remark) cur.remarks.add(remark);
        map.set(party, cur);
      }
    }

    for (const p of payRes.rows) handle(p.bill_type === "Debit" ? "debit" : "credit", p.d, p.party, n(p.fine), p.remark ?? "");
    for (const a of aavakRes.rows) handle("credit", a.d, a.party, n(a.fine), a.remark ?? "");
    for (const j of javakRes.rows) handle("debit", j.d, j.party, n(j.fine), j.remark ?? "");

    const toList = (map: Map<string, { fine: number; remarks: Set<string> }>): Entry[] =>
      [...map.entries()]
        .map(([account, v]) => ({ account, fine: v.fine, remark: [...v.remarks].join(" / ") }))
        .sort((a, b) => b.fine - a.fine);

    const credit = toList(dayCredit);
    const debit = toList(dayDebit);
    const opening = openCredit - openDebit;
    const creditTotal = credit.reduce((s, e) => s + e.fine, 0);
    const debitTotal = debit.reduce((s, e) => s + e.fine, 0);
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
