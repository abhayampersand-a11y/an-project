"use client"

import * as React from "react"
import { PrinterIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Entry = { date: string; fine: number; remark: string }
type Statement = {
  party: string
  city: string
  from: string
  to: string
  credit: Entry[]
  debit: Entry[]
  creditTotal: number
  debitTotal: number
  closing: number
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
const bal = (v: number) => `${Math.abs(v).toLocaleString("en-IN")} ${v >= 0 ? "cr" : "db"}`

export default function FineRojmedPage() {
  const [parties, setParties] = React.useState<string[]>([])
  const [party, setParty] = React.useState("")
  const [from, setFrom] = React.useState(`${new Date().getFullYear()}-01-01`)
  const [to, setTo] = React.useState(todayISO())
  const [loading, setLoading] = React.useState(false)
  const [stmt, setStmt] = React.useState<Statement | null>(null)

  React.useEffect(() => {
    fetch("/api/parties")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setParties(d.map((p) => p.party_name)) })
      .catch(() => {})
  }, [])

  async function handleCheck() {
    if (!party) {
      toast.error("Please select a party")
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/ledger/fine-rojmed?party=${encodeURIComponent(party)}&from=${from}&to=${to}`)
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
        <h1 className="text-xl font-semibold">FINE ROJMED</h1>
        <p className="text-sm text-muted-foreground">Om Casting &rsaquo; Fine Rojmed</p>
      </div>

      {/* filter */}
      <div className="rounded-lg border bg-card p-6">
        <div className="grid items-end gap-5 md:grid-cols-[1fr_1fr_auto]">
          <div className="flex flex-col gap-2">
            <Label className="text-sm">Party <span className="text-destructive">*</span></Label>
            <Select
              value={party}
              onValueChange={(v) => { if (v) setParty(v) }}
              items={parties.map((p) => ({ label: p, value: p }))}
            >
              <SelectTrigger className="w-full"><SelectValue placeholder="Select party" /></SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {parties.length === 0 ? (
                    <SelectItem value="__none" disabled>No parties</SelectItem>
                  ) : (
                    parties.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)
                  )}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-sm">Date <span className="text-destructive">*</span></Label>
            <div className="flex gap-2">
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
          <Button onClick={handleCheck} disabled={loading} className="px-8">
            {loading ? "Checking…" : "Check"}
          </Button>
        </div>
      </div>

      {/* statement */}
      {stmt && (
        <div id="fine-statement" className="rounded-lg border bg-card p-6">
          <style>{`
            @media print {
              body * { visibility: hidden !important; }
              #fine-statement, #fine-statement * { visibility: visible !important; }
              #fine-statement { position: absolute; top: 0; left: 0; width: 100%; }
            }
          `}</style>

          <div className="mb-4 text-sm">
            <div>
              <span className="font-semibold">party Statement For</span>{" "}
              <span className="text-primary">{stmt.party}{stmt.city ? `, (${stmt.city})` : ""}</span>
            </div>
            <div className="text-muted-foreground">From : {fmtDate(stmt.from)} To {fmtDate(stmt.to)}</div>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <Particulars title="Credit Particulars" entries={stmt.credit} total={stmt.creditTotal} />
            <div className="flex flex-col gap-3">
              <Particulars title="Debit Particulars" entries={stmt.debit} total={stmt.debitTotal} />
              <table className="w-full text-right text-sm">
                <tbody>
                  <tr className="text-muted-foreground">
                    <td className="py-1 pr-4 text-left font-medium">Closing Balance</td>
                    <td className="py-1 font-semibold text-primary">{bal(stmt.closing)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
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
            <th className="px-2 py-1 text-left">Date</th>
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
                <td className="px-2 py-1.5">{fmtDate(e.date)}</td>
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
