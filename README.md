# Admin Dashboard (Next.js 16 + shadcn/ui)

A static admin dashboard with:

- **Static login** (username/password from environment variables)
- **Protected dashboard** (sidebar + topbar + stat cards + orders table) — static UI
- **PostgreSQL connection** wired up (Vercel Postgres / Neon), with a live
  "Database connection" status card
- Built with **Next.js 16** (App Router), **Tailwind v4**, **shadcn/ui**

> Note on Next.js 16: middleware is now called **Proxy** (`src/proxy.ts`), and
> `cookies()` is **async**. This project follows those conventions.

---

## 1. Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 → you'll be redirected to `/login`.

**Default login** (from `.env.local`):

- Username: `admin`
- Password: `admin123`

Change these in `.env.local`. The dashboard renders even without a database —
the "Database connection" card will just show *Not connected* until you add a
connection string.

---

## 2. The database: how the pieces fit (READ THIS)

**pgAdmin is NOT a database and Vercel cannot connect to it.**

| Tool | Role |
|------|------|
| **PostgreSQL** | The actual database that stores data. |
| **Vercel Postgres / Neon** | A *cloud-hosted* PostgreSQL — gives you a connection string. **This is what Vercel and your app connect to.** |
| **pgAdmin** | A free desktop GUI to browse/edit a Postgres database. Runs on **your PC**. Optional. |

Flow:

```
Next.js (Vercel)  ─┐
                   ├──▶  Cloud Postgres (Vercel Postgres / Neon)  ◀── pgAdmin (your PC)
your app locally  ─┘            (one connection string)
```

Everyone uses the **same connection string**.

---

## 3. Deploy to Vercel (free) + attach Vercel Postgres

1. Push this folder to a **GitHub** repo.
2. Go to https://vercel.com → **Add New → Project** → import the repo →
   **Deploy**. (Next.js is auto-detected; the free Hobby plan is fine.)
3. In the project → **Storage** tab → **Create Database** → choose
   **Postgres** (provisioned via the Neon integration) → pick a region near you
   → **Create**.
4. Click **Connect** to attach it to this project. Vercel automatically adds the
   DB environment variables (including `POSTGRES_URL`) to the project.
5. Add the **login** env vars in **Settings → Environment Variables**:
   - `ADMIN_USERNAME` = your username
   - `ADMIN_PASSWORD` = your password
   - `AUTH_SECRET` = a long random string
     (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
6. **Redeploy** so the new env vars take effect.

Your code reads `DATABASE_URL` **or** `POSTGRES_URL` (see `src/lib/db.ts`), so it
works with whichever Vercel injects.

Verify the DB: open `https://YOUR-APP.vercel.app/api/db-health` → should return
`{ "ok": true, ... }`. The dashboard card shows **Connected**.

---

## 4. Get the connection string for local dev + pgAdmin

In Vercel → **Storage → your database → `.env.local` / Connection details**,
copy the connection string. It looks like:

```
postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require
```

Paste it into your local `.env.local` as `DATABASE_URL=...` to test the DB
locally.

---

## 5. pgAdmin setup (free, optional)

pgAdmin is **100% free and open-source**: https://www.pgadmin.org/download/

1. Download and install pgAdmin for Windows. Launch it (opens in your browser).
2. Take the connection string from step 4 and split it into parts:
   `postgresql://USER:PASSWORD@HOST/DBNAME`
3. In pgAdmin: right-click **Servers → Register → Server…**
   - **General** tab → Name: anything (e.g. `Vercel DB`)
   - **Connection** tab:
     - **Host name/address** = `HOST` (the part after `@`, before `/`)
     - **Port** = `5432`
     - **Maintenance database** = `DBNAME`
     - **Username** = `USER`
     - **Password** = `PASSWORD` (tick *Save password*)
   - **Parameters** tab → add **SSL mode** = `require`
   - **Save**
4. You can now browse tables, run SQL, and edit data in the same database your
   deployed app uses.

> Tip: create tables/data in pgAdmin, then replace the static arrays in
> `src/app/dashboard/page.tsx` with real `query(...)` calls from `src/lib/db.ts`.

---

## Project structure

```
src/
  proxy.ts                  # auth gate (Next 16 "middleware")
  lib/
    auth.ts                 # credential check + session helpers
    db.ts                   # Postgres connection pool (pg)
  app/
    page.tsx                # redirects to /dashboard
    login/
      page.tsx              # login form (shadcn)
      actions.ts            # login/logout server actions
    dashboard/
      layout.tsx            # sidebar + topbar
      page.tsx              # stat cards + orders table (static)
    api/db-health/route.ts  # live DB connectivity check
  components/
    db-status.tsx           # client card that pings /api/db-health
    ui/                     # shadcn components
```
