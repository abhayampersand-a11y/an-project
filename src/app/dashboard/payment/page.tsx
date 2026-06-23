"use client"

import * as React from "react"
import { type ColumnDef } from "@tanstack/react-table"
import { ArrowUpDownIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { useConfirm } from "@/components/confirm-dialog"
import { useActiveFinancialYear, filterByFinancialYear } from "@/lib/use-financial-year"
import { ListTable } from "@/components/list-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SearchableSelect } from "@/components/searchable-select"

type Payment = {
  id: number
  voucher_no: string | null
  bill_type: string
  party: string
  pay_date: string
  fine: string
  rs: string
  remark: string | null
  created_at: string
}

/** Today's local date as YYYY-MM-DD (no timezone shift). */
function todayISO() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${m}-${day}`
}

/** YYYY-MM-DD -> DD/MM/YYYY for display. */
function fmtDate(iso: string) {
  if (!iso) return ""
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}

const emptyForm = () => ({
  bill_type: "Credit",
  party: "",
  pay_date: todayISO(),
  fine: "0",
  rs: "0",
  remark: "",
})

export default function PaymentPage() {
  const confirm = useConfirm()
  const [payments, setPayments] = React.useState<Payment[]>([])
  const [loading, setLoading] = React.useState(true)
  const [parties, setParties] = React.useState<string[]>([])
  const [form, setForm] = React.useState(emptyForm())
  const [editingId, setEditingId] = React.useState<number | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [deletingId, setDeletingId] = React.useState<number | null>(null)
  const fy = useActiveFinancialYear()
  const shown = React.useMemo(() => filterByFinancialYear(payments, "pay_date", fy), [payments, fy])

  React.useEffect(() => {
    fetch("/api/payments")
      .then(async (r) => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error ?? "Failed to load payments")
        if (Array.isArray(data)) setPayments(data)
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load payments"))
      .finally(() => setLoading(false))

    fetch("/api/parties")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setParties(data.map((p) => p.party_name))
      })
      .catch(() => {})
  }, [])

  function startEdit(p: Payment) {
    setEditingId(p.id)
    setForm({
      bill_type: p.bill_type,
      party: p.party,
      pay_date: p.pay_date,
      fine: p.fine ?? "0",
      rs: p.rs ?? "0",
      remark: p.remark ?? "",
    })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm())
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.party || !form.pay_date || !form.remark.trim()) {
      toast.error("Party, date and remark are required")
      return
    }
    setSaving(true)
    try {
      if (editingId !== null) {
        const res = await fetch(`/api/payments/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
        const updated = await res.json()
        if (!res.ok) throw new Error(updated.error ?? "Update failed")
        setPayments((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
        toast.success("Payment updated")
        cancelEdit()
      } else {
        const res = await fetch("/api/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
        const created = await res.json()
        if (!res.ok) throw new Error(created.error ?? "Create failed")
        setPayments((prev) => [created, ...prev])
        toast.success("Payment added")
        setForm(emptyForm())
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    const ok = await confirm({
      title: "Delete payment?",
      description: "This will permanently remove the payment entry. This action cannot be undone.",
      confirmText: "Delete",
      destructive: true,
    })
    if (!ok) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/payments/${id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Delete failed")
      setPayments((prev) => prev.filter((p) => p.id !== id))
      toast.success("Payment deleted")
      if (editingId === id) cancelEdit()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error")
    } finally {
      setDeletingId(null)
    }
  }

  const columns: ColumnDef<Payment>[] = [
    {
      id: "serial",
      header: "#",
      cell: ({ row }) => row.index + 1,
      enableSorting: false,
    },
    {
      accessorKey: "voucher_no",
      header: ({ column }) => (
        <button className="flex items-center gap-1 hover:text-foreground" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Voucher <ArrowUpDownIcon className="size-3" />
        </button>
      ),
      cell: ({ row }) => row.original.voucher_no ?? "—",
    },
    {
      accessorKey: "bill_type",
      header: ({ column }) => (
        <button className="flex items-center gap-1 hover:text-foreground" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Bill Type <ArrowUpDownIcon className="size-3" />
        </button>
      ),
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={
            row.original.bill_type === "Credit"
              ? "border-green-500 text-green-600 dark:text-green-400"
              : "border-red-400 text-red-500"
          }
        >
          {row.original.bill_type}
        </Badge>
      ),
    },
    {
      accessorKey: "party",
      header: ({ column }) => (
        <button className="flex items-center gap-1 hover:text-foreground" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          party <ArrowUpDownIcon className="size-3" />
        </button>
      ),
    },
    {
      accessorKey: "pay_date",
      header: ({ column }) => (
        <button className="flex items-center gap-1 hover:text-foreground" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Date <ArrowUpDownIcon className="size-3" />
        </button>
      ),
      cell: ({ row }) => fmtDate(row.original.pay_date),
    },
    {
      accessorKey: "rs",
      header: ({ column }) => (
        <button className="flex items-center gap-1 hover:text-foreground" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Rs <ArrowUpDownIcon className="size-3" />
        </button>
      ),
      cell: ({ row }) => Number(row.original.rs).toLocaleString("en-IN"),
    },
    {
      accessorKey: "fine",
      header: ({ column }) => (
        <button className="flex items-center gap-1 hover:text-foreground" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Fine <ArrowUpDownIcon className="size-3" />
        </button>
      ),
      cell: ({ row }) => Number(row.original.fine).toLocaleString("en-IN"),
    },
    {
      accessorKey: "remark",
      header: ({ column }) => (
        <button className="flex items-center gap-1 hover:text-foreground" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Remark <ArrowUpDownIcon className="size-3" />
        </button>
      ),
      cell: ({ row }) => row.original.remark || "—",
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="size-8" onClick={() => startEdit(row.original)}>
            <PencilIcon className="size-3.5" />
          </Button>
          <Button
            variant="destructive"
            size="icon"
            className="size-8"
            disabled={deletingId === row.original.id}
            onClick={() => handleDelete(row.original.id)}
          >
            <Trash2Icon className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      {/* breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Rough Payment</h1>
        <p className="text-sm text-muted-foreground">Om Casting &rsaquo; Rough Payment</p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* ── LEFT: form ── */}
        <div className="w-full rounded-lg border bg-card p-4 md:p-6 lg:w-96 shrink-0">
          <h2 className="mb-5 text-center text-sm font-bold uppercase tracking-widest text-muted-foreground">
            {editingId ? "Edit Payment" : "Add Payment"}
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <fieldset disabled={saving} className="contents">
            <div className="grid grid-cols-[90px_1fr] items-center gap-3">
              <Label className="text-sm">Bill Type</Label>
              <div className="flex items-center gap-5">
                {["Credit", "Debit"].map((t) => (
                  <label key={t} className="flex cursor-pointer items-center gap-1.5 text-sm">
                    <input
                      type="radio"
                      name="bill_type"
                      className="accent-primary"
                      checked={form.bill_type === t}
                      onChange={() => setForm((f) => ({ ...f, bill_type: t }))}
                    />
                    {t}
                  </label>
                ))}
              </div>
            </div>

            <Field label="party" required>
              <SearchableSelect
                value={form.party}
                onValueChange={(v) => setForm((f) => ({ ...f, party: v }))}
                options={parties}
                placeholder="None"
                emptyText="No parties"
                className="w-full"
              />
            </Field>

            <Field label="Date" required>
              <Input
                type="date"
                value={form.pay_date}
                onChange={(e) => setForm((f) => ({ ...f, pay_date: e.target.value }))}
                required
              />
            </Field>

            <Field label="Fine" required>
              <Input
                type="number"
                step="0.001"
                value={form.fine}
                onChange={(e) => setForm((f) => ({ ...f, fine: e.target.value }))}
              />
            </Field>

            <Field label="Rs" required>
              <Input
                type="number"
                step="0.01"
                value={form.rs}
                onChange={(e) => setForm((f) => ({ ...f, rs: e.target.value }))}
              />
            </Field>

            <Field label="Remark" required>
              <textarea
                placeholder="Remark"
                value={form.remark}
                onChange={(e) => setForm((f) => ({ ...f, remark: e.target.value }))}
                className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
              />
            </Field>

            <div className="flex gap-2 pt-1">
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? "Saving…" : editingId ? "Edit Payment" : "Register"}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  Cancel
                </Button>
              )}
            </div>
            </fieldset>
          </form>
        </div>

        {/* ── RIGHT: table ── */}
        <div className="flex-1">
          <ListTable
            columns={columns as ColumnDef<Payment, unknown>[]}
            data={shown}
            loading={loading}
            emptyMessage="No payments found."
            exportConfig={{
              name: "payments",
              headers: ["#", "Voucher", "Bill Type", "Party", "Date", "Rs", "Fine", "Remark"],
              row: (p, i) => [i + 1, p.voucher_no ?? "", p.bill_type, p.party, fmtDate(p.pay_date), p.rs, p.fine, p.remark ?? ""],
            }}
          />
        </div>
      </div>

      {/* copyright footer */}
      <div className="mt-auto flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">
        <span>2020 - 2026 &copy; OM CASTING</span>
        <span>POWERED BY LARK INFOWAY.</span>
      </div>
    </div>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-[90px_1fr] items-start gap-3">
      <Label className="pt-2 text-sm">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <div>{children}</div>
    </div>
  )
}
