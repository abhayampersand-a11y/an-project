"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { PrinterIcon, ArrowLeftIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

type JavakItem = {
  item: string
  gross_w: number
  bag_w: number
  net_w: number
  touch: number
  wastage: number
  fine: number
  rate: number
  amount: number
}

type Javak = {
  id: number
  type: string
  bill_type: string
  inv_date: string
  invoice_no: string
  party: string
  city?: string | null
  items: JavakItem[]
  fine: string
  labour: string
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

const n2 = (v: unknown) => Number(v).toFixed(2)
const n0 = (v: unknown) => String(Math.round(Number(v)))

/** A signed balance -> magnitude + cr/db tag. */
function bal(value: number, positive: "cr" | "db", negative: "cr" | "db") {
  return `${Math.abs(Math.round(value))} ${value >= 0 ? positive : negative}`
}

export default function JavakInvoicePage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params.id
  const [javak, setJavak] = React.useState<Javak | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!id) return
    fetch(`/api/javaks/${id}`)
      .then(async (r) => {
        const d = await r.json()
        if (!r.ok) throw new Error(d.error ?? "Failed to load")
        setJavak(d)
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>
  if (!javak) return <div className="p-6 text-sm text-muted-foreground">Javak not found.</div>

  const items = javak.items ?? []
  const totalGross = items.reduce((s, it) => s + Number(it.gross_w), 0)
  const totalNet = items.reduce((s, it) => s + Number(it.net_w), 0)
  const totalFine = Number(javak.fine)
  const totalAmount = Number(javak.labour)

  return (
    <div className="flex flex-1 flex-col items-center gap-4 bg-muted/40 p-6 print:bg-white print:p-0">
      {/* Only #javak-invoice prints. */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #javak-invoice, #javak-invoice * { visibility: visible !important; }
          #javak-invoice { position: absolute; top: 0; left: 0; width: 100%; }
        }
      `}</style>

      {/* toolbar (auto-hidden when printing) */}
      <div className="flex w-full max-w-[820px] items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/invoice/javak")}>
          <ArrowLeftIcon className="size-4" /> Back
        </Button>
        <Button size="sm" onClick={() => window.print()}>
          <PrinterIcon className="size-4" /> Print
        </Button>
      </div>

      <div id="javak-invoice" className="flex w-full max-w-[820px] flex-col gap-4 overflow-x-auto">
        <InvoiceCopy
          copyLabel="Original"
          javak={javak}
          items={items}
          totalGross={totalGross}
          totalNet={totalNet}
          totalFine={totalFine}
          totalAmount={totalAmount}
        />
        <InvoiceCopy
          copyLabel="Duplicate"
          javak={javak}
          items={items}
          totalGross={totalGross}
          totalNet={totalNet}
          totalFine={totalFine}
          totalAmount={totalAmount}
        />
      </div>
    </div>
  )
}

function InvoiceCopy({
  copyLabel,
  javak,
  items,
  totalGross,
  totalNet,
  totalFine,
  totalAmount,
}: {
  copyLabel: string
  javak: Javak
  items: JavakItem[]
  totalGross: number
  totalNet: number
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
        <div className="text-center text-sm font-semibold">Estimate</div>
        <div className="absolute right-3 top-0 text-xs">{copyLabel}</div>
      </div>

      {/* party / invoice meta */}
      <div className="grid grid-cols-2 text-xs">
        <div className="border-r border-black">
          <div className="flex border-b border-black">
            <span className="w-14 border-r border-black px-2 py-1 font-medium">M/s.</span>
            <span className="px-2 py-1 font-semibold text-blue-700">{javak.party}</span>
          </div>
          <div className="flex">
            <span className="w-14 border-r border-black px-2 py-1 font-medium">City</span>
            <span className="px-2 py-1">{javak.city ?? "RAJKOT"}</span>
          </div>
        </div>
        <div>
          <div className="border-b border-black px-2 py-1">
            No :&nbsp;<span className="font-semibold text-blue-700">{javak.invoice_no}</span>
          </div>
          <div className="px-2 py-1">Date :&nbsp;{fmtDate(javak.inv_date)}</div>
        </div>
      </div>

      {/* item table */}
      <table className="w-full border-collapse text-center text-xs">
        <thead>
          <tr className="font-semibold">
            <th className={cell}>Sr.</th>
            <th className={`${cell} text-left`}>Product Name.</th>
            <th className={cell}>G Weight</th>
            <th className={cell}>Bag Weight</th>
            <th className={cell}>Net Weight</th>
            <th className={cell}>Touch</th>
            <th className={cell}>Wastage</th>
            <th className={cell}>T + W</th>
            <th className={cell}>Fine</th>
            <th className={cell}>Rate</th>
            <th className={cell}>Net Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i}>
              <td className={cell}>{i + 1}</td>
              <td className={`${cell} text-left font-semibold text-blue-700`}>{it.item}</td>
              <td className={cell}>{n0(it.gross_w)}</td>
              <td className={cell}>{n0(it.bag_w)}</td>
              <td className={cell}>{n0(it.net_w)}</td>
              <td className={cell}>{n2(it.touch)}</td>
              <td className={cell}>{n2(it.wastage)}</td>
              <td className={cell}>{n2(Number(it.touch) + Number(it.wastage))}</td>
              <td className={cell}>{n0(it.fine)}</td>
              <td className={cell}>{n0(it.rate)}</td>
              <td className={cell}>{n0(it.amount)}</td>
            </tr>
          ))}
          {/* pad to keep a consistent body height */}
          {Array.from({ length: Math.max(0, 6 - items.length) }).map((_, i) => (
            <tr key={`pad-${i}`}>
              {Array.from({ length: 11 }).map((__, c) => (
                <td key={c} className={cell}>&nbsp;</td>
              ))}
            </tr>
          ))}
          {/* total */}
          <tr className="font-semibold">
            <td className={cell} colSpan={2}>TOTAL</td>
            <td className={cell}>{n0(totalGross)}</td>
            <td className={cell}></td>
            <td className={cell}>{n0(totalNet)}</td>
            <td className={cell}></td>
            <td className={cell}></td>
            <td className={cell}></td>
            <td className={cell}>{n0(totalFine)}</td>
            <td className={cell}></td>
            <td className={cell}>{n0(totalAmount)}</td>
          </tr>
          {/* previous balance */}
          <tr>
            <td className={`${cell} text-right`} colSpan={8}>Previous Balance</td>
            <td className={`${cell} text-blue-700`}>{bal(Number(javak.previous_fine), "cr", "db")}</td>
            <td className={cell}></td>
            <td className={`${cell} text-blue-700`}>{bal(Number(javak.previous_amount), "cr", "db")}</td>
          </tr>
          {/* closing balance */}
          <tr>
            <td className={`${cell} text-right`} colSpan={8}>Closing Balance</td>
            <td className={`${cell} text-blue-700`}>{bal(Number(javak.closing_fine), "db", "cr")}</td>
            <td className={cell}></td>
            <td className={`${cell} text-blue-700`}>{bal(Number(javak.closing_amount), "cr", "db")}</td>
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
