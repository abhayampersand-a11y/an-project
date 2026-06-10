import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

type Entry = { date: string; invoice: string; fine: number; amount: number; remark: string };

type PartyRow = { city: string | null; opening_fine: string; opening_amount: string };
type PayRow = { d: string; voucher_no: string | null; bill_type: string; fine: string; rs: string; remark: string | null; id: number };
type AavakRow = { d: string; invoice_no: string; fine: string; amount: string; remark: string | null };
type JavakRow = { d: string; invoice_no: string; fine: string; labour: string; remark: string | null };

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
      query<PartyRow>("SELECT city, opening_fine, opening_amount FROM parties WHERE party_name=$1 LIMIT 1", [party]),
      query<PayRow>("SELECT to_char(pay_date,'YYYY-MM-DD') AS d, voucher_no, bill_type, fine, rs, remark, id FROM payments WHERE party=$1", [party]),
      query<AavakRow>("SELECT to_char(inv_date,'YYYY-MM-DD') AS d, invoice_no, fine, amount, remark FROM aavaks WHERE party=$1", [party]),
      query<JavakRow>("SELECT to_char(inv_date,'YYYY-MM-DD') AS d, invoice_no, fine, labour, remark FROM javaks WHERE party=$1", [party]),
    ]);

    const city = partyRes.rows[0]?.city ?? "";
    let openFine = n(partyRes.rows[0]?.opening_fine);
    let openAmount = n(partyRes.rows[0]?.opening_amount);

    const credit: Entry[] = [];
    const debit: Entry[] = [];

    const before = (d: string) => Boolean(from) && d < from;
    const inPeriod = (d: string) => (!from || d >= from) && (!to || d <= to);

    // Opening sits on the debit side (party owes at start). Pre-period debit
    // entries add to it, pre-period credit entries reduce it; in-period entries list out.
    function add(side: "credit" | "debit", e: Entry) {
      if (before(e.date)) {
        const sign = side === "debit" ? 1 : -1;
        openFine += sign * e.fine;
        openAmount += sign * e.amount;
      } else if (inPeriod(e.date)) {
        (side === "credit" ? credit : debit).push(e);
      }
    }

    for (const p of payRes.rows) {
      add(p.bill_type === "Debit" ? "debit" : "credit", {
        date: p.d, invoice: p.voucher_no ?? `P/${p.id}`, fine: n(p.fine), amount: n(p.rs), remark: p.remark ?? "",
      });
    }
    for (const a of aavakRes.rows) {
      add("credit", {
        date: a.d, invoice: a.invoice_no, fine: n(a.fine), amount: n(a.amount), remark: a.remark ?? "",
      });
    }
    for (const j of javakRes.rows) {
      add("debit", {
        date: j.d, invoice: j.invoice_no, fine: n(j.fine), amount: n(j.labour), remark: j.remark ?? "",
      });
    }

    credit.sort((a, b) => a.date.localeCompare(b.date));
    debit.sort((a, b) => a.date.localeCompare(b.date));

    const sum = (arr: Entry[], k: "fine" | "amount") => arr.reduce((s, e) => s + e[k], 0);
    const creditTotal = { fine: sum(credit, "fine"), amount: sum(credit, "amount") };
    const debitEntries = { fine: sum(debit, "fine"), amount: sum(debit, "amount") };
    // The opening balance is a debit row, so it is part of the debit total.
    const debitTotal = { fine: openFine + debitEntries.fine, amount: openAmount + debitEntries.amount };
    const closing = {
      fine: creditTotal.fine - debitTotal.fine,
      amount: creditTotal.amount - debitTotal.amount,
    };

    return NextResponse.json({
      party, city, from, to,
      opening: { fine: openFine, amount: openAmount },
      credit, debit, creditTotal, debitTotal, closing,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Query failed" }, { status: 500 });
  }
}
