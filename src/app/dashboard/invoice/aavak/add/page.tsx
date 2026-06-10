"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PlusIcon, MinusIcon } from "lucide-react"
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

/** Today's local date as YYYY-MM-DD (no timezone shift). */
function todayISO() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${m}-${day}`
}

const num = (v: unknown) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

type ItemRow = { item: string; gr_wt: string; amount: string }

const emptyItem = (): ItemRow => ({ item: "", gr_wt: "", amount: "" })

export default function AavakAddPageWrapper() {
  return (
    <React.Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading…</div>}>
      <AavakAddPage />
    </React.Suspense>
  )
}

function AavakAddPage() {
  const router = useRouter()
  const search = useSearchParams()
  const editId = search.get("id")

  const [invoiceNo, setInvoiceNo] = React.useState("")
  const [party, setParty] = React.useState("")
  const [invDate, setInvDate] = React.useState(todayISO())
  const [remark, setRemark] = React.useState("")
  const [previousAmount, setPreviousAmount] = React.useState("0")
  const [previousFine, setPreviousFine] = React.useState("0")
  const [roundoffFine, setRoundoffFine] = React.useState("0")
  const [roundoffAmount, setRoundoffAmount] = React.useState("0")

  const [items, setItems] = React.useState<ItemRow[]>([emptyItem()])

  const [parties, setParties] = React.useState<string[]>([])
  const [itemNames, setItemNames] = React.useState<string[]>([])
  const [saving, setSaving] = React.useState(false)

  // ── load reference data ──
  React.useEffect(() => {
    fetch("/api/parties")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setParties(d.map((p) => p.party_name)) })
      .catch(() => {})
    fetch("/api/items")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setItemNames(d.map((it) => it.item_name)) })
      .catch(() => {})
  }, [])

  // ── auto invoice number (new entries only) ──
  React.useEffect(() => {
    if (editId) return
    fetch("/api/aavaks/next")
      .then((r) => r.json())
      .then((d) => { if (d?.invoice_no) setInvoiceNo(d.invoice_no) })
      .catch(() => {})
  }, [editId])

  // ── load existing record for edit ──
  React.useEffect(() => {
    if (!editId) return
    fetch(`/api/aavaks/${editId}`)
      .then(async (r) => {
        const d = await r.json()
        if (!r.ok) throw new Error(d.error ?? "Failed to load")
        setInvoiceNo(d.invoice_no ?? "")
        setParty(d.party ?? "")
        setInvDate(d.inv_date ?? todayISO())
        setRemark(d.remark ?? "")
        setPreviousAmount(String(d.previous_amount ?? "0"))
        setPreviousFine(String(d.previous_fine ?? "0"))
        setRoundoffFine(String(d.roundoff_fine ?? "0"))
        setRoundoffAmount(String(d.roundoff_amount ?? "0"))
        const loaded: ItemRow[] = Array.isArray(d.items) && d.items.length
          ? d.items.map((it: Record<string, unknown>) => ({
              item: String(it.item ?? ""),
              gr_wt: String(it.gr_wt ?? ""),
              amount: String(it.amount ?? ""),
            }))
          : [emptyItem()]
        setItems(loaded)
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load"))
  }, [editId])

  // ── derived values ──
  // Aavak fine intake equals the gross (fine) weight of each item.
  const computedItems = items.map((it) => ({ ...it, fine: num(it.gr_wt), amountNum: num(it.amount) }))

  const totalFineRaw = computedItems.reduce((s, it) => s + it.fine, 0)
  const totalAmountRaw = computedItems.reduce((s, it) => s + it.amountNum, 0)
  const totalFine = totalFineRaw + num(roundoffFine)
  const totalAmount = totalAmountRaw + num(roundoffAmount)
  // Aavak is inward, so it adds to the party's running balance (credit).
  // The closing balance tracks the raw item totals; round off only adjusts the
  // displayed/billed Total above, it does not flow into the ledger.
  const closingFine = num(previousFine) + totalFineRaw
  const closingAmount = num(previousAmount) + totalAmountRaw

  // ── row helpers ──
  const setItem = (i: number, patch: Partial<ItemRow>) =>
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))
  const addItem = () => setItems((prev) => [...prev, emptyItem()])
  const removeItem = (i: number) => setItems((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev))

  async function handleSave() {
    if (!invoiceNo.trim() || !party || !invDate) {
      toast.error("No, party and date are required")
      return
    }
    setSaving(true)
    const payload = {
      inv_date: invDate,
      invoice_no: invoiceNo,
      party,
      items: computedItems.map((it) => ({
        item: it.item,
        gr_wt: num(it.gr_wt),
        fine: it.fine,
        amount: it.amountNum,
      })),
      fine: totalFine,
      amount: totalAmount,
      roundoff_fine: num(roundoffFine),
      roundoff_amount: num(roundoffAmount),
      previous_amount: num(previousAmount),
      previous_fine: num(previousFine),
      closing_amount: closingAmount,
      closing_fine: closingFine,
      remark,
    }
    try {
      const res = await fetch(editId ? `/api/aavaks/${editId}` : "/api/aavaks", {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Save failed")
      toast.success(editId ? "Aavak updated" : "Aavak added")
      router.push("/dashboard/invoice/aavak")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* breadcrumb */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">AAVAK</h1>
        <p className="text-sm text-muted-foreground">
          Om Casting &rsaquo; {editId ? "Edit" : "Add"} Aavak
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-5 text-sm font-bold uppercase tracking-widest text-muted-foreground">
          {editId ? "Edit" : "Add"} Aavak
        </h2>

        {/* ── header fields ── */}
        <div className="grid gap-5 md:grid-cols-2">
          <div className="grid grid-cols-[110px_1fr] items-center gap-3">
            <Label className="text-sm">Party</Label>
            <Select
              value={party}
              onValueChange={(v) => { if (v) setParty(v) }}
              items={parties.map((p) => ({ label: p, value: p }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select party" />
              </SelectTrigger>
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

          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-[110px_1fr] items-center gap-3">
              <Label className="text-sm">No</Label>
              <Input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} placeholder="2680" />
            </div>
            <div className="grid grid-cols-[110px_1fr] items-center gap-3">
              <Label className="text-sm">Date</Label>
              <Input type="date" value={invDate} onChange={(e) => setInvDate(e.target.value)} />
            </div>
          </div>
        </div>

        {/* ── item detail ── */}
        <div className="mt-8">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted-foreground">Item Detail</h3>
          <div className="overflow-x-auto">
            <div className="min-w-[680px]">
              <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr_56px] gap-2 px-1 pb-2 text-xs font-semibold uppercase text-muted-foreground">
                <span>Item</span><span>Gr Wt</span><span>Fine</span><span>Amount</span><span />
              </div>
              <div className="flex flex-col gap-2">
                {computedItems.map((it, i) => (
                  <div key={i} className="grid grid-cols-[1.4fr_1fr_1fr_1fr_56px] items-center gap-2">
                    <Select
                      value={it.item}
                      onValueChange={(v) => { if (v) setItem(i, { item: v }) }}
                      items={itemNames.map((n) => ({ label: n, value: n }))}
                    >
                      <SelectTrigger><SelectValue placeholder="Item" /></SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {itemNames.length === 0 ? (
                            <SelectItem value="__none" disabled>No items</SelectItem>
                          ) : (
                            itemNames.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)
                          )}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <Input type="number" value={it.gr_wt} onChange={(e) => setItem(i, { gr_wt: e.target.value })} />
                    <Input value={it.fine || ""} readOnly className="bg-muted" />
                    <Input type="number" value={it.amount} onChange={(e) => setItem(i, { amount: e.target.value })} />
                    <Button type="button" variant="destructive" size="icon" className="size-9" onClick={() => removeItem(i)}>
                      <MinusIcon className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex justify-end">
                <Button type="button" variant="outline" size="icon" className="size-9" onClick={addItem}>
                  <PlusIcon className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ── totals / remark ── */}
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-[130px_1fr] items-start gap-3">
              <Label className="pt-2 text-sm">Remark</Label>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="Remark"
                className="flex min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
              />
            </div>
            <div className="grid grid-cols-[130px_1fr] items-center gap-3">
              <Label className="text-sm">Previous Amount</Label>
              <Input type="number" value={previousAmount} onChange={(e) => setPreviousAmount(e.target.value)} />
            </div>
            <div className="grid grid-cols-[130px_1fr] items-center gap-3">
              <Label className="text-sm">Previous Fine</Label>
              <Input type="number" value={previousFine} onChange={(e) => setPreviousFine(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-[140px_1fr] items-center gap-3">
              <Label className="text-sm">Total Fine</Label>
              <Input value={totalFineRaw} readOnly className="bg-muted" />
            </div>
            <div className="grid grid-cols-[140px_1fr] items-center gap-3">
              <Label className="text-sm">Total Amount</Label>
              <Input value={totalAmountRaw} readOnly className="bg-muted" />
            </div>
            <div className="grid grid-cols-[140px_1fr] items-center gap-3">
              <Label className="text-sm">Round off Fine</Label>
              <Input type="number" value={roundoffFine} onChange={(e) => setRoundoffFine(e.target.value)} />
            </div>
            <div className="grid grid-cols-[140px_1fr] items-center gap-3">
              <Label className="text-sm">Round off Amount</Label>
              <Input type="number" value={roundoffAmount} onChange={(e) => setRoundoffAmount(e.target.value)} />
            </div>
            <div className="grid grid-cols-[140px_1fr] items-center gap-3">
              <Label className="text-sm">Total Fine</Label>
              <Input value={totalFine} readOnly className="bg-muted" />
            </div>
            <div className="grid grid-cols-[140px_1fr] items-center gap-3">
              <Label className="text-sm">Total Amount</Label>
              <Input value={totalAmount} readOnly className="bg-muted" />
            </div>
            <div className="grid grid-cols-[140px_1fr] items-center gap-3">
              <Label className="text-sm">Closing Amount</Label>
              <Input value={`${closingAmount} ${closingAmount >= 0 ? "cr" : "db"}`} readOnly className="bg-muted" />
            </div>
            <div className="grid grid-cols-[140px_1fr] items-center gap-3">
              <Label className="text-sm">Closing Fine</Label>
              <Input value={`${closingFine} ${closingFine >= 0 ? "cr" : "db"}`} readOnly className="bg-muted" />
            </div>
          </div>
        </div>

        {/* ── actions ── */}
        <div className="mt-8 flex justify-center gap-3">
          <Button onClick={handleSave} disabled={saving} className="px-10">
            {saving ? "Saving…" : editId ? "Update" : "Add"}
          </Button>
          <Button variant="outline" onClick={() => router.push("/dashboard/invoice/aavak")}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
