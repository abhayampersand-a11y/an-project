import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

type JavakRow = {
  id: number;
  type: string;
  bill_type: string;
  inv_date: string;
  invoice_no: string;
  party: string;
  bags: unknown;
  items: unknown;
  fine: string;
  labour: string;
  previous_amount: string;
  previous_fine: string;
  closing_amount: string;
  closing_fine: string;
  remark: string | null;
  created_at: string;
};

// inv_date is returned as plain YYYY-MM-DD text to avoid timezone shifts.
const SELECT =
  `id, type, bill_type, to_char(inv_date, 'YYYY-MM-DD') AS inv_date, invoice_no, party,
   bags, items, fine, labour, previous_amount, previous_fine, closing_amount, closing_fine,
   remark, created_at`;

export async function GET() {
  try {
    const result = await query<JavakRow>(
      `SELECT ${SELECT} FROM javaks ORDER BY inv_date DESC, id DESC`,
    );
    return NextResponse.json(result.rows);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Query failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    if (!b.invoice_no || !b.party || !b.inv_date) {
      return NextResponse.json(
        { error: "Invoice no, party and date are required" },
        { status: 400 },
      );
    }
    const result = await query<JavakRow>(
      `INSERT INTO javaks
        (type, bill_type, inv_date, invoice_no, party, bags, items, fine, labour,
         previous_amount, previous_fine, closing_amount, closing_fine, remark)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING ${SELECT}`,
      [
        b.type === "g" ? "g" : "w",
        b.bill_type === "Credit" ? "Credit" : "Debit",
        b.inv_date,
        b.invoice_no,
        b.party,
        JSON.stringify(Array.isArray(b.bags) ? b.bags : []),
        JSON.stringify(Array.isArray(b.items) ? b.items : []),
        Number(b.fine) || 0,
        Number(b.labour) || 0,
        Number(b.previous_amount) || 0,
        Number(b.previous_fine) || 0,
        Number(b.closing_amount) || 0,
        Number(b.closing_fine) || 0,
        b.remark ?? "",
      ],
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Query failed" }, { status: 500 });
  }
}
