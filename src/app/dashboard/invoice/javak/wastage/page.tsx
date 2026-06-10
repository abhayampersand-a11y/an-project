"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PlusIcon, MinusIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BalanceInput } from "@/components/balance-input"
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

const round2 = (n: number) => Math.round(n * 100) / 100

type BagRow = { tr: string; no_of_bag: string; weight_per_bag: string }
type ItemRow = {
  item: string
  tr: string
  gross_w: string
  net_w: string
  touch: string
  wastage: string
  rate: string
}

const emptyBag = (): BagRow => ({ tr: "1", no_of_bag: "", weight_per_bag: "" })
const emptyItem = (): ItemRow => ({ item: "", tr: "1", gross_w: "", net_w: "", touch: "", wastage: "", rate: "" })

/** Total bag weight for a given Tr across the bag rows. */
const bagWeightOf = (tr: string, arr: BagRow[]) =>
  arr.filter((b) => b.tr === tr).reduce((s, b) => s + num(b.no_of_bag) * num(b.weight_per_bag), 0)

/** Re-fill each item's auto Net Weight (Gross − Bag) against the given bags. */
const withNet = (its: ItemRow[], arr: BagRow[]): ItemRow[] =>
  its.map((it) => ({ ...it, net_w: String(round2(num(it.gross_w) - bagWeightOf(it.tr, arr))) }))

const TR_OPTIONS = Array.from({ length: 10 }, (_, i) => String(i + 1))

export default function JavakWastagePageWrapper() {
  return (
    <React.Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading…</div>}>
      <JavakWastagePage />
    </React.Suspense>
  )
}

function JavakWastagePage() {
  const router = useRouter()
  const search = useSearchParams()
  const editId = search.get("id")
  const typeParam = search.get("type") === "g" ? "g" : "w"

  const [type, setType] = React.useState<"w" | "g">(typeParam)
  const [billType, setBillType] = React.useState("Debit")
  const [invoiceNo, setInvoiceNo] = React.useState("")
  const [party, setParty] = React.useState("")
  const [invDate, setInvDate] = React.useState(todayISO())
  const [remark, setRemark] = React.useState("")
  const [previousAmount, setPreviousAmount] = React.useState("0")
  const [previousFine, setPreviousFine] = React.useState("0")

  const [bags, setBags] = React.useState<BagRow[]>([emptyBag()])
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
    fetch("/api/javaks/next")
      .then((r) => r.json())
      .then((d) => { if (d?.invoice_no) setInvoiceNo(d.invoice_no) })
      .catch(() => {})
  }, [editId])

  // ── load existing record for edit ──
  React.useEffect(() => {
    if (!editId) return
    fetch(`/api/javaks/${editId}`)
      .then(async (r) => {
        const d = await r.json()
        if (!r.ok) throw new Error(d.error ?? "Failed to load")
        setType(d.type === "g" ? "g" : "w")
        setBillType(d.bill_type ?? "Debit")
        setInvoiceNo(d.invoice_no ?? "")
        setParty(d.party ?? "")
        setInvDate(d.inv_date ?? todayISO())
        setRemark(d.remark ?? "")
        setPreviousAmount(String(d.previous_amount ?? "0"))
        setPreviousFine(String(d.previous_fine ?? "0"))
        const loadedBags: BagRow[] = Array.isArray(d.bags) && d.bags.length
          ? d.bags.map((b: Record<string, unknown>) => ({
              tr: String(b.tr ?? "1"),
              no_of_bag: String(b.no_of_bag ?? ""),
              weight_per_bag: String(b.weight_per_bag ?? ""),
            }))
          : [emptyBag()]
        const loadedItems: ItemRow[] = Array.isArray(d.items) && d.items.length
          ? d.items.map((it: Record<string, unknown>) => ({
              item: String(it.item ?? ""),
              tr: String(it.tr ?? "1"),
              gross_w: String(it.gross_w ?? ""),
              net_w: String(it.net_w ?? ""),
              touch: String(it.touch ?? ""),
              wastage: String(it.wastage ?? ""),
              rate: String(it.rate ?? ""),
            }))
          : [emptyItem()]
        setBags(loadedBags)
        setItems(loadedItems)
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load"))
  }, [editId])

  // ── auto-fill previous balance from the party's last entry (new entries only) ──
  React.useEffect(() => {
    if (editId || !party) return
    let cancelled = false
    fetch(`/api/ledger/last?party=${encodeURIComponent(party)}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || !d) return
        setPreviousAmount(String(d.previous_amount ?? 0))
        setPreviousFine(String(d.previous_fine ?? 0))
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [party, editId])

  // ── derived values ──
  const bagTotal = (b: BagRow) => num(b.no_of_bag) * num(b.weight_per_bag)

  const computedItems = items.map((it) => {
    const bag_w = bagWeightOf(it.tr, bags)
    const net_num = num(it.net_w)
    const fine = Math.round(net_num * (num(it.touch) + num(it.wastage)) / 100)
    const amount = Math.round(net_num * num(it.rate) / 1000)
    return { ...it, bag_w, net_num, fine, amount }
  })

  const totalFine = computedItems.reduce((s, it) => s + it.fine, 0)
  const totalLabour = computedItems.reduce((s, it) => s + it.amount, 0)
  // Javak is outward: it draws down the party's running balance. A balance that
  // stays positive after the draw-down is still credit (cr); going below zero
  // flips it to debit (dr).
  const closingAmount = num(previousAmount) - totalLabour
  const closingFine = num(previousFine) - totalFine

  // ── row helpers ──
  // Changing bags re-fills the auto Net Weight of every item.
  const setBag = (i: number, patch: Partial<BagRow>) => {
    const next = bags.map((b, idx) => (idx === i ? { ...b, ...patch } : b))
    setBags(next)
    setItems((its) => withNet(its, next))
  }
  const addBag = () => setBags((prev) => [...prev, emptyBag()])
  const removeBag = (i: number) => {
    if (bags.length <= 1) return
    const next = bags.filter((_, idx) => idx !== i)
    setBags(next)
    setItems((its) => withNet(its, next))
  }

  const setItem = (i: number, patch: Partial<ItemRow>) =>
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))
  const addItem = () => setItems((prev) => [...prev, emptyItem()])
  const removeItem = (i: number) => setItems((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev))

  // Tr options available to item rows = distinct Tr values used by bag rows.
  const itemTrOptions = Array.from(new Set(bags.map((b) => b.tr)))

  async function handleSave() {
    if (!invoiceNo.trim() || !party || !invDate) {
      toast.error("Invoice no, party and date are required")
      return
    }
    setSaving(true)
    const payload = {
      type,
      bill_type: billType,
      inv_date: invDate,
      invoice_no: invoiceNo,
      party,
      bags: bags.map((b) => ({
        tr: num(b.tr),
        no_of_bag: num(b.no_of_bag),
        weight_per_bag: num(b.weight_per_bag),
        total_weight: bagTotal(b),
      })),
      items: computedItems.map((it) => ({
        item: it.item,
        tr: num(it.tr),
        gross_w: num(it.gross_w),
        bag_w: it.bag_w,
        net_w: it.net_num,
        touch: num(it.touch),
        wastage: num(it.wastage),
        fine: it.fine,
        rate: num(it.rate),
        amount: it.amount,
      })),
      fine: totalFine,
      labour: totalLabour,
      previous_amount: num(previousAmount),
      previous_fine: num(previousFine),
      closing_amount: closingAmount,
      closing_fine: closingFine,
      remark,
    }
    try {
      const res = await fetch(editId ? `/api/javaks/${editId}` : "/api/javaks", {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Save failed")
      toast.success(editId ? "Javak updated" : "Javak added")
      router.push("/dashboard/invoice/javak")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error")
    } finally {
      setSaving(false)
    }
  }

  const title = type === "w" ? "Wastage" : "Ghat"

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      {/* breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">JAVAK</h1>
        <p className="text-sm text-muted-foreground">
          Om Casting &rsaquo; {editId ? "Edit" : "Add"} Javak {title}
        </p>
      </div>

      <div className="rounded-lg border bg-card p-4 md:p-6">
        <h2 className="mb-5 text-sm font-bold uppercase tracking-widest text-muted-foreground">
          {editId ? "Edit" : "Add"} Javak {title}
        </h2>

        {/* ── header fields ── */}
        <div className="grid gap-5 md:grid-cols-2">
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-[110px_1fr] items-center gap-3">
              <Label className="text-sm">Bill Type</Label>
              <div className="flex items-center gap-5">
                <label className="flex cursor-pointer items-center gap-1.5 text-sm">
                  <input
                    type="radio"
                    name="bill_type"
                    className="accent-primary"
                    checked={billType === "Debit"}
                    readOnly
                  />
                  Debit
                </label>
              </div>
            </div>
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
          </div>

          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-[110px_1fr] items-center gap-3">
              <Label className="text-sm">Invoice No</Label>
              <Input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} placeholder="322" />
            </div>
            <div className="grid grid-cols-[110px_1fr] items-center gap-3">
              <Label className="text-sm">Date</Label>
              <Input type="date" value={invDate} onChange={(e) => setInvDate(e.target.value)} />
            </div>
          </div>
        </div>

        {/* ── bag rows ── */}
        <div className="mt-8 overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-[110px_1fr_1fr_1fr_88px] gap-3 px-1 pb-2 text-xs font-semibold uppercase text-muted-foreground">
              <span>Tr</span>
              <span>No of Bag</span>
              <span>Weight / Bag</span>
              <span>Total Weight</span>
              <span />
            </div>
            <div className="flex flex-col gap-3">
              {bags.map((b, i) => (
                <div key={i} className="grid grid-cols-[110px_1fr_1fr_1fr_88px] items-center gap-3">
                  <Select
                    value={b.tr}
                    onValueChange={(v) => { if (v) setBag(i, { tr: v }) }}
                    items={TR_OPTIONS.map((t) => ({ label: t, value: t }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {TR_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <Input type="number" value={b.no_of_bag} onChange={(e) => setBag(i, { no_of_bag: e.target.value })} />
                  <Input type="number" value={b.weight_per_bag} onChange={(e) => setBag(i, { weight_per_bag: e.target.value })} />
                  <Input value={bagTotal(b) || ""} readOnly className="bg-muted" />
                  <div className="flex gap-1">
                    <Button type="button" variant="outline" size="icon" className="size-9" onClick={addBag}>
                      <PlusIcon className="size-4" />
                    </Button>
                    <Button type="button" variant="destructive" size="icon" className="size-9" onClick={() => removeBag(i)}>
                      <MinusIcon className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── item detail ── */}
        <div className="mt-8">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted-foreground">Item Detail</h3>
          <div className="overflow-x-auto">
            <div className="min-w-[1100px]">
              <div className="grid grid-cols-[1.4fr_70px_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_56px] gap-2 px-1 pb-2 text-xs font-semibold uppercase text-muted-foreground">
                <span>Item</span><span>Tr</span><span>Gross W.</span><span>Bag W.</span><span>Net W.</span>
                <span>Touch</span><span>Wastage</span><span>Fine</span><span>Rate</span><span>Amount</span><span />
              </div>
              <div className="flex flex-col gap-2">
                {computedItems.map((it, i) => (
                  <div key={i} className="grid grid-cols-[1.4fr_70px_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_56px] items-center gap-2">
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
                    <Select
                      value={it.tr}
                      onValueChange={(v) => { if (v) setItem(i, { tr: v, net_w: String(round2(num(it.gross_w) - bagWeightOf(v, bags))) }) }}
                      items={itemTrOptions.map((t) => ({ label: t, value: t }))}
                    >
                      <SelectTrigger className="px-2"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {itemTrOptions.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <Input type="number" value={it.gross_w} onChange={(e) => setItem(i, { gross_w: e.target.value, net_w: String(round2(num(e.target.value) - bagWeightOf(it.tr, bags))) })} />
                    <Input value={it.bag_w || ""} readOnly className="bg-muted" />
                    <Input type="number" value={it.net_w} onChange={(e) => setItem(i, { net_w: e.target.value })} />
                    <Input type="number" value={it.touch} onChange={(e) => setItem(i, { touch: e.target.value })} />
                    <Input type="number" value={it.wastage} onChange={(e) => setItem(i, { wastage: e.target.value })} />
                    <Input value={it.fine || ""} readOnly className="bg-muted" />
                    <Input type="number" value={it.rate} onChange={(e) => setItem(i, { rate: e.target.value })} />
                    <Input value={it.amount || ""} readOnly className="bg-muted" />
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
              <BalanceInput value={previousAmount} onChange={setPreviousAmount} />
            </div>
            <div className="grid grid-cols-[130px_1fr] items-center gap-3">
              <Label className="text-sm">Previous Fine</Label>
              <BalanceInput value={previousFine} onChange={setPreviousFine} />
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-[130px_1fr] items-center gap-3">
              <Label className="text-sm">Total Fine</Label>
              <Input value={totalFine} readOnly className="bg-muted" />
            </div>
            <div className="grid grid-cols-[130px_1fr] items-center gap-3">
              <Label className="text-sm">Total Labour</Label>
              <Input value={totalLabour} readOnly className="bg-muted" />
            </div>
            <div className="grid grid-cols-[130px_1fr] items-center gap-3">
              <Label className="text-sm">Closing Amount</Label>
              <Input value={`${Math.abs(closingAmount)} ${closingAmount >= 0 ? "cr" : "dr"}`} readOnly className="bg-muted" />
            </div>
            <div className="grid grid-cols-[130px_1fr] items-center gap-3">
              <Label className="text-sm">Closing Fine</Label>
              <Input value={`${Math.abs(closingFine)} ${closingFine >= 0 ? "cr" : "dr"}`} readOnly className="bg-muted" />
            </div>
          </div>
        </div>

        {/* ── actions ── */}
        <div className="mt-8 flex justify-center gap-3">
          <Button onClick={handleSave} disabled={saving} className="px-10">
            {saving ? "Saving…" : editId ? "Update" : "Add"}
          </Button>
          <Button variant="outline" onClick={() => router.push("/dashboard/invoice/javak")}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
