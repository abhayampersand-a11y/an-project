import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

// Returns the next Aavak number: highest numeric value seen + 1.
export async function GET() {
  try {
    const r = await query<{ invoice_no: string }>("SELECT invoice_no FROM aavaks");
    let max = 0;
    for (const row of r.rows) {
      const m = /(\d+)\s*$/.exec(row.invoice_no ?? "");
      if (m) max = Math.max(max, Number(m[1]));
    }
    return NextResponse.json({ invoice_no: String(max + 1) });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Query failed" }, { status: 500 });
  }
}
