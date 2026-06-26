// One-time backfill: recompute previous/closing balances on every existing
// aavak and javak so they include the party's opening fine/amount.
//
// Matches the app's live logic (src/app/api/ledger/last/route.ts):
//   previous = opening(debit) + every transaction dated STRICTLY BEFORE this
//              entry   (Aavak = credit, Javak = debit, Payment by bill type)
//   closing  = previous + this entry's own contribution
// Balance convention is credit − debit: positive → cr, negative → dr.
//
// Run with:  node scripts/backfill-balances.mjs   (add --dry-run to preview)
import { Pool } from "pg";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "..", ".env.local");
try {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([\w]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {
  // .env.local optional — env may already be set
}

const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
if (!connectionString) {
  console.error("❌ No DATABASE_URL found in .env.local");
  process.exit(1);
}

const DRY_RUN = process.argv.includes("--dry-run");

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes("localhost") ? false : { rejectUnauthorized: false },
});

const n = (v) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};
const r3 = (x) => Math.round(x * 1000) / 1000; // fine  → 3 decimals
const r2 = (x) => Math.round(x * 100) / 100; // amount → 2 decimals

try {
  const [parties, payments, aavaks, javaks] = await Promise.all([
    pool.query("SELECT party_name, opening_fine, opening_amount FROM parties"),
    pool.query("SELECT party, to_char(pay_date,'YYYY-MM-DD') AS d, bill_type, fine, rs FROM payments"),
    pool.query("SELECT id, party, to_char(inv_date,'YYYY-MM-DD') AS d, fine, amount FROM aavaks"),
    pool.query("SELECT id, party, to_char(inv_date,'YYYY-MM-DD') AS d, fine, labour FROM javaks"),
  ]);

  // Opening balance per party, on the debit side (party owes at start).
  const opening = new Map();
  for (const p of parties.rows) {
    opening.set(p.party_name, { fine: -n(p.opening_fine), amount: -n(p.opening_amount) });
  }

  // Signed ledger deltas per party (credit − debit), each tagged with its date.
  const deltas = new Map(); // party -> [{ d, fine, amount }]
  const push = (party, d, fine, amount) => {
    if (!deltas.has(party)) deltas.set(party, []);
    deltas.get(party).push({ d, fine, amount });
  };
  for (const p of payments.rows) {
    const sign = p.bill_type === "Debit" ? -1 : 1;
    push(p.party, p.d, sign * n(p.fine), sign * n(p.rs));
  }
  for (const a of aavaks.rows) push(a.party, a.d, n(a.fine), n(a.amount)); // credit
  for (const j of javaks.rows) push(j.party, j.d, -n(j.fine), -n(j.labour)); // debit

  // previous = opening + sum of this party's deltas dated strictly before `date`.
  const previousAt = (party, date) => {
    const base = opening.get(party) ?? { fine: 0, amount: 0 };
    let fine = base.fine;
    let amount = base.amount;
    for (const x of deltas.get(party) ?? []) {
      if (x.d < date) {
        fine += x.fine;
        amount += x.amount;
      }
    }
    return { fine, amount };
  };

  const client = await pool.connect();
  let updated = 0;
  try {
    if (!DRY_RUN) await client.query("BEGIN");

    for (const a of aavaks.rows) {
      const prev = previousAt(a.party, a.d);
      const closeFine = r3(prev.fine + n(a.fine)); // aavak = credit
      const closeAmount = r2(prev.amount + n(a.amount));
      if (DRY_RUN) {
        console.log(`AAVAK #${a.id} ${a.party} prevFine=${r3(prev.fine)} prevAmt=${r2(prev.amount)} closeFine=${closeFine} closeAmt=${closeAmount}`);
      } else {
        await client.query(
          "UPDATE aavaks SET previous_fine=$1, previous_amount=$2, closing_fine=$3, closing_amount=$4 WHERE id=$5",
          [r3(prev.fine), r2(prev.amount), closeFine, closeAmount, a.id],
        );
      }
      updated++;
    }

    for (const j of javaks.rows) {
      const prev = previousAt(j.party, j.d);
      const closeFine = r3(prev.fine - n(j.fine)); // javak = debit
      const closeAmount = r2(prev.amount - n(j.labour));
      if (DRY_RUN) {
        console.log(`JAVAK #${j.id} ${j.party} prevFine=${r3(prev.fine)} prevAmt=${r2(prev.amount)} closeFine=${closeFine} closeAmt=${closeAmount}`);
      } else {
        await client.query(
          "UPDATE javaks SET previous_fine=$1, previous_amount=$2, closing_fine=$3, closing_amount=$4 WHERE id=$5",
          [r3(prev.fine), r2(prev.amount), closeFine, closeAmount, j.id],
        );
      }
      updated++;
    }

    if (!DRY_RUN) await client.query("COMMIT");
  } catch (e) {
    if (!DRY_RUN) await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }

  console.log(
    DRY_RUN
      ? `\n🔍 Dry run: ${updated} rows would be updated (aavaks + javaks).`
      : `\n✅ Backfilled ${updated} rows (aavaks + javaks).`,
  );
} catch (err) {
  console.error("❌ Backfill failed:", err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
