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
import { PartySelect } from "@/components/party-select"

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

/** Copper touch rate — assumed constant (read-only in the form). */
const COPPER_TOUCH = 2.5

type ItemRow = { item: string; gr_wt: string; touch: string }

const emptyItem = (): ItemRow => ({ item: "", gr_wt: "", touch: "" })

export default function GaranuAddPageWrapper() {
  return (
    <React.Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading…</div>}>
      <GaranuAddPage />
    </React.Suspense>
  )
}

function GaranuAddPage() {
  const router = useRouter()
  const search = useSearchParams()
  const editId = search.get("id")

  const [party, setParty] = React.useState("")
  const [invDate, setInvDate] = React.useState(todayISO())
  const [remark, setRemark] = React.useState("")
  const [mTouch, setMTouch] = React.useState("0")
  const [mTouch2, setMTouch2] = React.useState("")

  const [items, setItems] = React.useState<ItemRow[]>([emptyItem()])

  const [itemNames, setItemNames] = React.useState<string[]>([])
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    fetch("/api/items")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setItemNames(d.map((it) => it.item_name)) })
      .catch(() => {})
  }, [])

  React.useEffect(() => {
    if (!editId) return
    fetch(`/api/garanus/${editId}`)
      .then(async (r) => {
        const d = await r.json()
        if (!r.ok) throw new Error(d.error ?? "Failed to load")
        setParty(d.party ?? "")
        setInvDate(d.inv_date ?? todayISO())
        setRemark(d.remark ?? "")
        setMTouch(String(d.m_touch ?? "0"))
        setMTouch2(d.m_touch2 ? String(d.m_touch2) : "")
        const loaded: ItemRow[] = Array.isArray(d.items) && d.items.length
          ? d.items.map((it: Record<string, unknown>) => ({
              item: String(it.item ?? ""),
              gr_wt: String(it.gr_wt ?? ""),
              touch: String(it.touch ?? ""),
            }))
          : [emptyItem()]
        setItems(loaded)
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load"))
  }, [editId])

  // ── derived values ──
  const computedItems = items.map((it) => ({
    ...it,
    fine: Math.round(num(it.gr_wt) * num(it.touch) / 100),
  }))

  const fine = computedItems.reduce((s, it) => s + it.fine, 0)
  const gWeight = computedItems.reduce((s, it) => s + num(it.gr_wt), 0)

  // m_touch2 is kept in sync with M TOUCH (the target/second-melting touch).
  const mt2 = num(mTouch2)
  // Weight that would hold `fine` pure gold at the target touch.
  const needWeight = mt2 > 0 ? Math.round(fine * 100 / mt2) : 0
  // Copper/alloy part of the lot.
  const rCopper = needWeight >= gWeight ? needWeight - gWeight : gWeight - fine
  const copperF1 = Math.round(rCopper * COPPER_TOUCH / 100)
  const copperF2 = copperF1
  const fine2 = fine
  const totalF = fine2 + copperF2
  const fBaad2 = gWeight
  const rGaranu = gWeight + rCopper

  // Garanu = final lot weight after mixing copper (touch COPPER_TOUCH) to reach
  // the target touch; Final Copper is the copper added (negative = removed).
  const mt = mt2 / 100
  const ct = COPPER_TOUCH / 100
  const hasTarget = mt2 > 0 && Math.abs(mt - ct) > 1e-9
  const garanuNum = Math.round(gWeight + (fine - gWeight * mt) / (mt - ct))
  const garanu: number | "" = hasTarget ? garanuNum : ""
  const finalCopper: number | "" = hasTarget ? garanuNum - gWeight : ""

  // ── row helpers ──
  const setItem = (i: number, patch: Partial<ItemRow>) =>
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))
  const addItem = () => setItems((prev) => [...prev, emptyItem()])
  const removeItem = (i: number) => setItems((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev))

  async function handleSave() {
    if (!party || !invDate) {
      toast.error("Party and date are required")
      return
    }
    setSaving(true)
    const payload = {
      inv_date: invDate,
      party,
      items: computedItems.map((it) => ({
        item: it.item,
        gr_wt: num(it.gr_wt),
        touch: num(it.touch),
        fine: it.fine,
      })),
      m_touch: num(mTouch),
      m_touch2: num(mTouch2),
      copper_t: COPPER_TOUCH,
      fine,
      g_weight: gWeight,
      total_f: totalF,
      garanu: num(garanu),
      final_copper: num(finalCopper),
      details: { r_copper: rCopper, copper_f1: copperF1, copper_f2: copperF2, fine2, f_baad2: fBaad2, r_garanu: num(rGaranu) },
      remark,
    }
    try {
      const res = await fetch(editId ? `/api/garanus/${editId}` : "/api/garanus", {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Save failed")
      toast.success(editId ? "Garanu updated" : "Garanu added")
      router.push("/dashboard/invoice/garanu")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">GARANU</h1>
        <p className="text-sm text-muted-foreground">Om Casting &rsaquo; {editId ? "Edit" : "Add"} Garanu</p>
      </div>

      <div className="rounded-lg border bg-card p-4 md:p-6">
        <h2 className="mb-5 text-sm font-bold uppercase tracking-widest text-muted-foreground">
          {editId ? "Edit" : "Add"} Garanu
        </h2>

        {/* ── header fields ── */}
        <div className="grid gap-5 md:grid-cols-2">
          <div className="grid grid-cols-[110px_1fr] items-center gap-3">
            <Label className="text-sm">Party</Label>
            <PartySelect
              value={party}
              onValueChange={setParty}
              onlyVepari
              placeholder="Select party"
              className="w-full"
            />
          </div>
          <div className="grid grid-cols-[110px_1fr] items-center gap-3">
            <Label className="text-sm">Date</Label>
            <Input type="date" value={invDate} onChange={(e) => setInvDate(e.target.value)} />
          </div>
        </div>

        {/* ── item detail ── */}
        <div className="mt-8">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted-foreground">Item Detail</h3>
          <div className="overflow-x-auto">
            <div className="min-w-[720px]">
              <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr_56px] gap-2 px-1 pb-2 text-xs font-semibold uppercase text-muted-foreground">
                <span>Item</span><span>Gr Wt</span><span>Touch</span><span>Fine</span><span />
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
                    <Input type="number" value={it.touch} onChange={(e) => setItem(i, { touch: e.target.value })} />
                    <Input value={it.fine || ""} readOnly className="bg-muted" />
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

        {/* ── derived block (two columns) ── */}
        <div className="mt-8 grid gap-x-10 gap-y-4 md:grid-cols-2">
          {/* left */}
          <Row label="Fine"><Ro value={fine} /></Row>
          <Row label="copper_f2"><Ro value={copperF2} /></Row>

          <Row label="M TOUCH"><Input type="number" value={mTouch} onChange={(e) => { setMTouch(e.target.value); setMTouch2(e.target.value) }} /></Row>
          <Row label="fine2"><Ro value={fine2} /></Row>

          <Row label="r_garanu"><Ro value={rGaranu} /></Row>
          <Row label="total_f"><Ro value={totalF} /></Row>

          <Row label="gWeight"><Ro value={gWeight} /></Row>
          <Row label="m_touch2"><Input type="number" value={mTouch2} onChange={(e) => { setMTouch2(e.target.value); setMTouch(e.target.value) }} placeholder="m_touch2" /></Row>

          <Row label="r_copper"><Ro value={rCopper} /></Row>
          <Row label="Garanu"><Ro value={garanu} /></Row>

          <Row label="copper_t"><Ro value={COPPER_TOUCH} /></Row>
          <Row label="f_baad2"><Ro value={fBaad2} /></Row>

          <Row label="copper_f1"><Ro value={copperF1} /></Row>
          <Row label="Final Copper"><Ro value={finalCopper} /></Row>
        </div>

        {/* ── remark + actions ── */}
        <div className="mt-8 grid grid-cols-[110px_1fr] items-start gap-3 md:max-w-xl">
          <Label className="pt-2 text-sm">Remark</Label>
          <textarea
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="Remark"
            className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
          />
        </div>

        <div className="mt-8 flex justify-center gap-3">
          <Button onClick={handleSave} disabled={saving} className="px-10">
            {saving ? "Saving…" : editId ? "Update" : "Add"}
          </Button>
          <Button variant="outline" onClick={() => router.push("/dashboard/invoice/garanu")}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_1fr] items-center gap-3">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  )
}

function Ro({ value }: { value: string | number }) {
  return <Input value={value} readOnly className="bg-muted" />
}
