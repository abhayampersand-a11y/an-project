import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

type PaymentRow = {
  id: number;
  voucher_no: string | null;
  bill_type: string;
  party: string;
  pay_date: string;
  fine: string;
  rs: string;
  remark: string | null;
  created_at: string;
};

// pay_date is returned as plain YYYY-MM-DD text to avoid timezone shifts.
const SELECT =
  "id, voucher_no, bill_type, party, to_char(pay_date, 'YYYY-MM-DD') AS pay_date, fine, rs, remark, created_at";

/** Next "P/NNNN" voucher number from the highest existing one. */
async function nextVoucherNo() {
  const r = await query<{ voucher_no: string | null }>("SELECT voucher_no FROM payments");
  let max = 0;
  for (const row of r.rows) {
    const m = /(\d+)\s*$/.exec(row.voucher_no ?? "");
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `P/${max + 1}`;
}

export async function GET() {
  try {
    const result = await query<PaymentRow>(`SELECT ${SELECT} FROM payments ORDER BY pay_date DESC, id DESC`);
    return NextResponse.json(result.rows);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Query failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    if (!b.party || !b.pay_date || !b.remark) {
      return NextResponse.json(
        { error: "Party, date and remark are required" },
        { status: 400 },
      );
    }
    const voucher_no = await nextVoucherNo();
    const result = await query<PaymentRow>(
      `INSERT INTO payments (voucher_no, bill_type, party, pay_date, fine, rs, remark)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING ${SELECT}`,
      [
        voucher_no,
        b.bill_type === "Debit" ? "Debit" : "Credit",
        b.party,
        b.pay_date,
        Number(b.fine) || 0,
        Number(b.rs) || 0,
        b.remark ?? "",
      ],
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Query failed" }, { status: 500 });
  }
}
