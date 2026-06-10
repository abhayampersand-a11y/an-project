"use client"

import * as React from "react"
import { PrinterIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type Row = { sr: number; party: string; fine: number; amount: number }

const round = (v: number) => Math.round(Math.abs(v)).toString()
const tag = (v: number) => (v > 0 ? "cr" : "db")

export default function FinalReportPage() {
  const [rows, setRows] = React.useState<Row[]>([])
  const [loading, setLoading] = React.useState(true)
  const [filter, setFilter] = React.useState("")

  React.useEffect(() => {
    fetch("/api/ledger/final-report")
      .then(async (r) => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error ?? "Failed to load report")
        if (Array.isArray(data)) setRows(data)
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load report"))
      .finally(() => setLoading(false))
  }, [])

  const shown = filter
    ? rows.filter((r) => r.party.toLowerCase().includes(filter.toLowerCase()))
    : rows

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Final Report</h1>
        <p className="text-sm text-muted-foreground">Om Casting &rsaquo; Final Report</p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Input
          placeholder="Search party…"
          className="h-9 w-64"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <PrinterIcon className="size-4" /> Print
        </Button>
      </div>

      <div id="final-report" className="rounded-lg border bg-card p-6">
        <style>{`
          @media print {
            body * { visibility: hidden !important; }
            #final-report, #final-report * { visibility: visible !important; }
            #final-report { position: absolute; top: 0; left: 0; width: 100%; }
          }
        `}</style>

        <div className="text-center text-2xl font-bold tracking-wide">OM CASTING</div>
        <div className="mb-4 mt-2 border-y py-2 text-center text-lg font-semibold text-muted-foreground">
          FINAL REPORT
        </div>

        <div className="overflow-hidden rounded border">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead className="text-xs font-semibold uppercase">SR No.</TableHead>
                <TableHead className="text-xs font-semibold uppercase">Party</TableHead>
                <TableHead className="text-xs font-semibold uppercase">Fine</TableHead>
                <TableHead className="text-xs font-semibold uppercase">Rs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">Loading…</TableCell>
                </TableRow>
              ) : shown.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No parties found.</TableCell>
                </TableRow>
              ) : (
                shown.map((r) => (
                  <TableRow key={r.sr} className="hover:bg-muted/40">
                    <TableCell className="py-2">{r.sr}</TableCell>
                    <TableCell className="py-2 text-primary">{r.party}</TableCell>
                    <TableCell className="py-2">F. {round(r.fine)} {tag(r.fine)}</TableCell>
                    <TableCell className="py-2">&#8377; {round(r.amount)} {tag(r.amount)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">
        <span>2020 - 2026 &copy; OM CASTING</span>
        <span>POWERED BY LARK INFOWAY.</span>
      </div>
    </div>
  )
}
