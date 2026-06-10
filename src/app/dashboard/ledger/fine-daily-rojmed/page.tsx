"use client"

import * as React from "react"
import { PrinterIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Entry = { account: string; fine: number; remark: string }
type Statement = {
  date: string
  opening: number
  openingLabel: string
  credit: Entry[]
  debit: Entry[]
  creditTotal: number
  debitTotal: number
  closing: number
  closingLabel: string
}

function todayISO() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${m}-${day}`
}

function fmtDate(iso: string) {
  if (!iso) return ""
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}

const inr = (v: number) => v.toLocaleString("en-IN")

export default function FineDailyRojmedPage() {
  const [date, setDate] = React.useState(todayISO())
  const [loading, setLoading] = React.useState(false)
  const [stmt, setStmt] = React.useState<Statement | null>(null)

  async function handleCheck() {
    setLoading(true)
    try {
      const res = await fetch(`/api/ledger/fine-daily-rojmed?date=${date}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to load statement")
      setStmt(data)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">DAILY FINE ROJMED</h1>
        <p className="text-sm text-muted-foreground">Om Casting &rsaquo; Daily Fine Rojmed</p>
      </div>

      {/* filter */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex flex-wrap items-end gap-5">
          <div className="flex flex-col gap-2">
            <Label className="text-sm">Date <span className="text-destructive">*</span></Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-56" />
          </div>
          <Button onClick={handleCheck} disabled={loading} className="px-8">
            {loading ? "Checking…" : "Check"}
          </Button>
        </div>
      </div>

      {/* statement */}
      {stmt && (
        <div id="dailyfine-statement" className="rounded-lg border bg-card p-6">
          <style>{`
            @media print {
              body * { visibility: hidden !important; }
              #dailyfine-statement, #dailyfine-statement * { visibility: visible !important; }
              #dailyfine-statement { position: absolute; top: 0; left: 0; width: 100%; }
            }
          `}</style>

          <div className="mb-4 text-sm">
            <div className="font-semibold">party Statement For</div>
            <div className="text-muted-foreground">of : {fmtDate(stmt.date)}</div>
            <div className="font-semibold">Opening Balance fine</div>
            <div className="text-muted-foreground">of : {inr(stmt.opening)}</div>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <div className="flex flex-col gap-3">
              <Particulars title="Credit Particulars" entries={stmt.credit} total={stmt.creditTotal} />
              {/* T-account carry-down summary */}
              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td className="py-1 text-right tabular-nums">{inr(stmt.opening)}</td>
                    <td className="py-1 pl-3 text-muted-foreground">{stmt.openingLabel} Opening Balance</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-right tabular-nums">{inr(stmt.creditTotal)}</td>
                    <td />
                  </tr>
                  <tr className="border-t font-semibold">
                    <td className="py-1 text-right tabular-nums">{inr(stmt.opening + stmt.creditTotal)}</td>
                    <td />
                  </tr>
                  <tr>
                    <td className="py-1 text-right tabular-nums">{inr(stmt.debitTotal)}</td>
                    <td />
                  </tr>
                  <tr className="border-t font-semibold">
                    <td className="py-1 text-right tabular-nums text-primary">{inr(stmt.closing)}</td>
                    <td className="py-1 pl-3 text-muted-foreground">{stmt.closingLabel} closing balance</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <Particulars title="Debit Particulars" entries={stmt.debit} total={stmt.debitTotal} />
          </div>

          <div className="mt-6 flex justify-center">
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <PrinterIcon className="size-4" /> Print
            </Button>
          </div>
        </div>
      )}

      <div className="mt-auto flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">
        <span>2020 - 2026 &copy; OM CASTING</span>
        <span>POWERED BY LARK INFOWAY.</span>
      </div>
    </div>
  )
}

function Particulars({
  title,
  entries,
  total,
}: {
  title: string
  entries: Entry[]
  total: number
}) {
  return (
    <div>
      <p className="mb-2 text-center text-sm font-semibold text-muted-foreground">{title}</p>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-xs uppercase text-muted-foreground">
            <th className="px-2 py-1 text-left">Account</th>
            <th className="px-2 py-1 text-right">Fine</th>
            <th className="px-2 py-1 text-left">Remark</th>
          </tr>
        </thead>
        <tbody>
          {entries.length === 0 ? (
            <tr><td colSpan={3} className="h-12 text-center text-muted-foreground">—</td></tr>
          ) : (
            entries.map((e, i) => (
              <tr key={i} className="border-b border-dashed">
                <td className="px-2 py-1.5 text-primary">{e.account}</td>
                <td className="px-2 py-1.5 text-right">{inr(e.fine)}</td>
                <td className="px-2 py-1.5">{e.remark}</td>
              </tr>
            ))
          )}
          <tr className="border-t font-semibold">
            <td className="px-2 py-1.5">Total</td>
            <td className="px-2 py-1.5 text-right">{inr(total)}</td>
            <td />
          </tr>
        </tbody>
      </table>
    </div>
  )
}
