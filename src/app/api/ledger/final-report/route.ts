import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

type PartyRow = { party_name: string; opening_fine: string; opening_amount: string };
type PayRow = { party: string; bill_type: string; fine: string; rs: string };
type AavakRow = { party: string; fine: string; amount: string };
type JavakRow = { party: string; fine: string; labour: string };

const n = (v: unknown) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

type Acc = { creditFine: number; creditAmount: number; debitFine: number; debitAmount: number };

export async function GET() {
  try {
    const [partyRes, payRes, aavakRes, javakRes] = await Promise.all([
      query<PartyRow>("SELECT party_name, opening_fine, opening_amount FROM parties ORDER BY party_name"),
      query<PayRow>("SELECT party, bill_type, fine, rs FROM payments"),
      query<AavakRow>("SELECT party, fine, amount FROM aavaks"),
      query<JavakRow>("SELECT party, fine, labour FROM javaks"),
    ]);

    // Seed every party with its opening balance on the debit side.
    const map = new Map<string, Acc>();
    for (const p of partyRes.rows) {
      map.set(p.party_name, {
        creditFine: 0, creditAmount: 0,
        debitFine: n(p.opening_fine), debitAmount: n(p.opening_amount),
      });
    }
    const ensure = (party: string): Acc => {
      let m = map.get(party);
      if (!m) { m = { creditFine: 0, creditAmount: 0, debitFine: 0, debitAmount: 0 }; map.set(party, m); }
      return m;
    };

    for (const p of payRes.rows) {
      const m = ensure(p.party);
      if (p.bill_type === "Debit") { m.debitFine += n(p.fine); m.debitAmount += n(p.rs); }
      else { m.creditFine += n(p.fine); m.creditAmount += n(p.rs); }
    }
    for (const a of aavakRes.rows) {
      const m = ensure(a.party);
      m.creditFine += n(a.fine);
      m.creditAmount += n(a.amount);
    }
    for (const j of javakRes.rows) {
      const m = ensure(j.party);
      m.debitFine += n(j.fine);
      m.debitAmount += n(j.labour);
    }

    const rows = partyRes.rows.map((p, i) => {
      const m = map.get(p.party_name)!;
      return {
        sr: i + 1,
        party: p.party_name,
        fine: m.creditFine - m.debitFine,
        amount: m.creditAmount - m.debitAmount,
      };
    });

    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Query failed" }, { status: 500 });
  }
}
