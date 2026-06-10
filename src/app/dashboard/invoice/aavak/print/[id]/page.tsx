"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { PrinterIcon, ArrowLeftIcon, DownloadIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { downloadElementAsPdf, safeFileName } from "@/lib/download-pdf"

type AavakItem = {
  item: string
  gr_wt: number
  fine: number
  amount: number
}

type Aavak = {
  id: number
  inv_date: string
  invoice_no: string
  party: string
  city?: string | null
  items: AavakItem[]
  fine: string
  amount: string
  roundoff_fine: string
  roundoff_amount: string
  previous_amount: string
  previous_fine: string
  closing_amount: string
  closing_fine: string
  remark: string | null
}

/** YYYY-MM-DD -> DD/MM/YYYY. */
function fmtDate(iso: string) {
  if (!iso) return ""
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}

const n0 = (v: unknown) => String(Math.round(Number(v)))

/** A signed balance -> magnitude + cr/dr tag (never shows a minus sign). */
function bal(value: number, positive: "cr" | "dr", negative: "cr" | "dr") {
  return `${Math.abs(Math.round(value))} ${value >= 0 ? positive : negative}`
}

export default function AavakInvoicePage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params.id
  const [aavak, setAavak] = React.useState<Aavak | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!id) return
    fetch(`/api/aavaks/${id}`)
      .then(async (r) => {
        const d = await r.json()
        if (!r.ok) throw new Error(d.error ?? "Failed to load")
        setAavak(d)
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>
  if (!aavak) return <div className="p-6 text-sm text-muted-foreground">Aavak not found.</div>

  const items = aavak.items ?? []
  const totalGross = items.reduce((s, it) => s + Number(it.gr_wt), 0)
  const totalFine = Number(aavak.fine)
  const totalAmount = Number(aavak.amount)

  return (
    <div className="flex flex-1 flex-col items-center gap-4 bg-muted/40 p-6 print:bg-white print:p-0">
      {/* Only #aavak-invoice prints. */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #aavak-invoice, #aavak-invoice * { visibility: visible !important; }
          #aavak-invoice { position: absolute; top: 0; left: 0; width: 100%; }
        }
      `}</style>

      {/* toolbar (auto-hidden when printing) */}
      <div className="flex w-full max-w-[820px] items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/invoice/aavak")}>
          <ArrowLeftIcon className="size-4" /> Back
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadElementAsPdf("aavak-invoice", safeFileName(`Aavak-${aavak.invoice_no}.pdf`))}
          >
            <DownloadIcon className="size-4" /> Download PDF
          </Button>
          <Button size="sm" onClick={() => window.print()}>
            <PrinterIcon className="size-4" /> Print
          </Button>
        </div>
      </div>

      <div id="aavak-invoice" className="flex w-full max-w-[820px] flex-col gap-4 overflow-x-auto">
        <InvoiceCopy
          copyLabel="Original"
          aavak={aavak}
          items={items}
          totalGross={totalGross}
          totalFine={totalFine}
          totalAmount={totalAmount}
        />
        <InvoiceCopy
          copyLabel="Duplicate"
          aavak={aavak}
          items={items}
          totalGross={totalGross}
          totalFine={totalFine}
          totalAmount={totalAmount}
        />
      </div>
    </div>
  )
}

function InvoiceCopy({
  copyLabel,
  aavak,
  items,
  totalGross,
  totalFine,
  totalAmount,
}: {
  copyLabel: string
  aavak: Aavak
  items: AavakItem[]
  totalGross: number
  totalFine: number
  totalAmount: number
}) {
  const cell = "border border-black px-2 py-1"
  return (
    <div className="min-w-[680px] break-inside-avoid border border-black bg-white text-black">
      {/* religious header */}
      <div className="grid grid-cols-3 px-3 pt-2 text-[11px]">
        <span className="text-left">Shree Ganeshay Namah</span>
        <span className="text-center">|| શ્રીજી ||</span>
        <span className="text-right">Om Namah Shivay</span>
      </div>

      {/* brand */}
      <div className="text-center text-3xl font-extrabold tracking-wide">OM CASTING</div>

      {/* estimate / copy */}
      <div className="relative border-b border-black pb-1">
        <div className="text-center text-sm font-semibold">Aavak</div>
        <div className="absolute right-3 top-0 text-xs">{copyLabel}</div>
      </div>

      {/* party / invoice meta */}
      <div className="grid grid-cols-2 text-xs">
        <div className="border-r border-black">
          <div className="flex border-b border-black">
            <span className="w-14 border-r border-black px-2 py-1 font-medium">M/s.</span>
            <span className="px-2 py-1 font-semibold text-blue-700">{aavak.party}</span>
          </div>
          <div className="flex">
            <span className="w-14 border-r border-black px-2 py-1 font-medium">City</span>
            <span className="px-2 py-1">{aavak.city ?? "RAJKOT"}</span>
          </div>
        </div>
        <div>
          <div className="border-b border-black px-2 py-1">
            No :&nbsp;<span className="font-semibold text-blue-700">{aavak.invoice_no}</span>
          </div>
          <div className="px-2 py-1">Date :&nbsp;{fmtDate(aavak.inv_date)}</div>
        </div>
      </div>

      {/* item table */}
      <table className="w-full border-collapse text-center text-xs">
        <thead>
          <tr className="font-semibold">
            <th className={cell}>Sr.</th>
            <th className={`${cell} text-left`}>Product Name.</th>
            <th className={cell}>Gr Weight</th>
            <th className={cell}>Fine</th>
            <th className={cell}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i}>
              <td className={cell}>{i + 1}</td>
              <td className={`${cell} text-left font-semibold text-blue-700`}>{it.item}</td>
              <td className={cell}>{n0(it.gr_wt)}</td>
              <td className={cell}>{n0(it.fine)}</td>
              <td className={cell}>{n0(it.amount)}</td>
            </tr>
          ))}
          {/* pad to keep a consistent body height */}
          {Array.from({ length: Math.max(0, 6 - items.length) }).map((_, i) => (
            <tr key={`pad-${i}`}>
              {Array.from({ length: 5 }).map((__, c) => (
                <td key={c} className={cell}>&nbsp;</td>
              ))}
            </tr>
          ))}
          {/* total */}
          <tr className="font-semibold">
            <td className={cell} colSpan={2}>TOTAL</td>
            <td className={cell}>{n0(totalGross)}</td>
            <td className={cell}>{n0(totalFine)}</td>
            <td className={cell}>{n0(totalAmount)}</td>
          </tr>
          {/* remark + previous balance */}
          <tr>
            <td className={`${cell} text-left align-top`} colSpan={2} rowSpan={2}>
              {aavak.remark ? (
                <span><span className="font-semibold text-red-600">Remark :</span> {aavak.remark}</span>
              ) : null}
            </td>
            <td className={`${cell} text-right`}>Previous Balance</td>
            <td className={`${cell} text-blue-700`}>{bal(Number(aavak.previous_fine), "cr", "dr")}</td>
            <td className={`${cell} text-blue-700`}>{bal(Number(aavak.previous_amount), "cr", "dr")}</td>
          </tr>
          {/* closing balance */}
          <tr>
            <td className={`${cell} text-right`}>Closing Balance</td>
            <td className={`${cell} text-blue-700`}>{bal(Number(aavak.closing_fine), "cr", "dr")}</td>
            <td className={`${cell} text-blue-700`}>{bal(Number(aavak.closing_amount), "cr", "dr")}</td>
          </tr>
        </tbody>
      </table>

      {/* signatory */}
      <div className="px-3 pb-4 pt-2 text-right text-xs">
        <div className="font-semibold">For , OM CASTING</div>
        <div className="mt-6 text-muted-foreground">(Authorised Signatory)</div>
      </div>
    </div>
  )
}
