import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

const SELECT =
  "id, voucher_no, bill_type, party, to_char(pay_date, 'YYYY-MM-DD') AS pay_date, fine, rs, remark, created_at";

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

const COLUMNS = ["bill_type", "party", "pay_date", "fine", "rs", "remark"] as const;

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (isNaN(Number(id))) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    const body = await req.json();
    const fields: string[] = [];
    const values: unknown[] = [];
    let i = 1;

    for (const col of COLUMNS) {
      if (body[col] !== undefined) {
        fields.push(`${col}=$${i++}`);
        if (col === "fine" || col === "rs") {
          values.push(Number(body[col]) || 0);
        } else {
          values.push(body[col]);
        }
      }
    }

    if (!fields.length) return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    values.push(id);

    const result = await query<PaymentRow>(
      `UPDATE payments SET ${fields.join(", ")} WHERE id=$${i} RETURNING ${SELECT}`,
      values,
    );
    if (!result.rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(result.rows[0]);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Query failed" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (isNaN(Number(id))) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    const result = await query<{ id: number }>("DELETE FROM payments WHERE id=$1 RETURNING id", [id]);
    if (!result.rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ message: "Deleted", id: result.rows[0].id });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Query failed" }, { status: 500 });
  }
}
