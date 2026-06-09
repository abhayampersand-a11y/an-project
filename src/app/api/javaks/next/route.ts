import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

const PREFIX = "S/";

// Returns the next invoice number: prefix + (highest numeric suffix seen + 1).
export async function GET() {
  try {
    const r = await query<{ invoice_no: string }>("SELECT invoice_no FROM javaks");
    let max = 0;
    for (const row of r.rows) {
      const m = /(\d+)\s*$/.exec(row.invoice_no ?? "");
      if (m) max = Math.max(max, Number(m[1]));
    }
    return NextResponse.json({ invoice_no: `${PREFIX}${max + 1}` });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Query failed" }, { status: 500 });
  }
}
