// One-time database setup. Creates all tables if they don't exist.
// Run with:  npm run db:setup
import { Pool } from "pg";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Load DATABASE_URL from .env.local (simple parser, no extra deps).
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

const connectionString =
  process.env.DATABASE_URL ?? process.env.POSTGRES_URL;

if (!connectionString) {
  console.error("❌ No DATABASE_URL found in .env.local");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes("localhost")
    ? false
    : { rejectUnauthorized: false },
});

const SQL = `
CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(150) UNIQUE NOT NULL,
  role       VARCHAR(50) DEFAULT 'User',
  status     VARCHAR(50) DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS states (
  id         SERIAL PRIMARY KEY,
  state_name VARCHAR(100) NOT NULL,
  state_code VARCHAR(20),
  country    VARCHAR(100) NOT NULL DEFAULT 'India',
  status     VARCHAR(20) DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cities (
  id         SERIAL PRIMARY KEY,
  city_name  VARCHAR(100) NOT NULL,
  city_code  VARCHAR(20),
  status     VARCHAR(20) DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS items (
  id         SERIAL PRIMARY KEY,
  item_name  VARCHAR(150) NOT NULL,
  status     VARCHAR(20) DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id         SERIAL PRIMARY KEY,
  bill_type  VARCHAR(10) NOT NULL DEFAULT 'Credit',
  party      VARCHAR(150) NOT NULL,
  pay_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  fine       NUMERIC(14,3) DEFAULT 0,
  rs         NUMERIC(14,2) DEFAULT 0,
  remark     TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS parties (
  id             SERIAL PRIMARY KEY,
  party_name     VARCHAR(150) NOT NULL,
  mobile         VARCHAR(20),
  address        TEXT,
  opening_fine   NUMERIC(14,3) DEFAULT 0,
  opening_amount NUMERIC(14,2) DEFAULT 0,
  city           VARCHAR(100),
  party_type     VARCHAR(50) NOT NULL DEFAULT 'Vepari',
  state          VARCHAR(100),
  status         VARCHAR(20) DEFAULT 'Active',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
`;

try {
  await pool.query(SQL);
  console.log("✅ Database setup complete. Tables ready: users, states, cities, items, parties, payments");
} catch (err) {
  console.error("❌ Setup failed:", err.message);
  process.exit(1);
} finally {
  await pool.end();
}
