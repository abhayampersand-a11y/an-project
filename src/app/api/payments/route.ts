import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

type PaymentRow = {
  id: number;
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
  "id, bill_type, party, to_char(pay_date, 'YYYY-MM-DD') AS pay_date, fine, rs, remark, created_at";

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
    const result = await query<PaymentRow>(
      `INSERT INTO payments (bill_type, party, pay_date, fine, rs, remark)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING ${SELECT}`,
      [
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
