"use client"

import * as React from "react"
import { type ColumnDef } from "@tanstack/react-table"
import { ArrowUpDownIcon, PencilIcon, Trash2Icon, CheckCircle2Icon, PlusIcon } from "lucide-react"
import { toast } from "sonner"

import { useConfirm } from "@/components/confirm-dialog"
import { ListTable } from "@/components/list-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type FinancialYear = {
  id: number
  label: string
  start_date: string
  end_date: string
  is_active: boolean
  created_at: string
}

/** YYYY-MM-DD -> DD/MM/YYYY for display. */
function fmtDate(iso: string) {
  if (!iso) return ""
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}

const EMPTY = { label: "", start_date: "", end_date: "" }

export default function FinancialYearPage() {
  const confirm = useConfirm()
  const [years, setYears] = React.useState<FinancialYear[]>([])
  const [loading, setLoading] = React.useState(true)
  const [open, setOpen] = React.useState(false)
  const [form, setForm] = React.useState(EMPTY)
  const [makeActive, setMakeActive] = React.useState(false)
  const [editingId, setEditingId] = React.useState<number | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [deletingId, setDeletingId] = React.useState<number | null>(null)

  React.useEffect(() => {
    fetch("/api/financial-years")
      .then(async (r) => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error ?? "Failed to load financial years")
        if (Array.isArray(data)) setYears(data)
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false))
  }, [])

  function openAdd() {
    setEditingId(null)
    setForm(EMPTY)
    setMakeActive(years.length === 0) // first year defaults to active
    setOpen(true)
  }

  function openEdit(fy: FinancialYear) {
    setEditingId(fy.id)
    setForm({ label: fy.label, start_date: fy.start_date, end_date: fy.end_date })
    setMakeActive(fy.is_active)
    setOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.label.trim() || !form.start_date || !form.end_date) {
      toast.error("Label, start date and end date are required")
      return
    }
    if (form.start_date > form.end_date) {
      toast.error("Start date must be on or before end date")
      return
    }
    setSaving(true)
    const payload = { ...form, label: form.label.trim(), is_active: makeActive }
    try {
      if (editingId !== null) {
        const res = await fetch(`/api/financial-years/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const updated = await res.json()
        if (!res.ok) throw new Error(updated.error ?? "Update failed")
        await reload()
        toast.success("Financial year updated")
      } else {
        const res = await fetch("/api/financial-years", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const created = await res.json()
        if (!res.ok) throw new Error(created.error ?? "Create failed")
        await reload()
        toast.success("Financial year added")
      }
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error")
    } finally {
      setSaving(false)
    }
  }

  async function reload() {
    const r = await fetch("/api/financial-years")
    const data = await r.json()
    if (Array.isArray(data)) setYears(data)
  }

  async function activate(fy: FinancialYear) {
    if (fy.is_active) return
    try {
      const res = await fetch(`/api/financial-years/${fy.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: true }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed")
      setYears((prev) => prev.map((y) => ({ ...y, is_active: y.id === fy.id })))
      toast.success(`${fy.label} is now the active year`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error")
    }
  }

  async function handleDelete(fy: FinancialYear) {
    const ok = await confirm({
      title: "Delete financial year?",
      description: `This will permanently remove "${fy.label}". This action cannot be undone.`,
      confirmText: "Delete",
      destructive: true,
    })
    if (!ok) return
    setDeletingId(fy.id)
    try {
      const res = await fetch(`/api/financial-years/${fy.id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Delete failed")
      setYears((prev) => prev.filter((y) => y.id !== fy.id))
      toast.success("Financial year deleted")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error")
    } finally {
      setDeletingId(null)
    }
  }

  const columns: ColumnDef<FinancialYear>[] = [
    {
      id: "serial",
      header: "#",
      cell: ({ row }) => row.index + 1,
      enableSorting: false,
    },
    {
      accessorKey: "label",
      header: ({ column }) => (
        <button className="flex items-center gap-1 hover:text-foreground" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Year <ArrowUpDownIcon className="size-3" />
        </button>
      ),
    },
    {
      accessorKey: "start_date",
      header: "Start Date",
      cell: ({ row }) => fmtDate(row.original.start_date),
    },
    {
      accessorKey: "end_date",
      header: "End Date",
      cell: ({ row }) => fmtDate(row.original.end_date),
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) =>
        row.original.is_active ? (
          <Badge variant="outline" className="border-green-500 text-green-600 dark:text-green-400">
            Active
          </Badge>
        ) : (
          <button onClick={() => activate(row.original)}>
            <Badge variant="outline" className="cursor-pointer text-muted-foreground">
              Set active
            </Badge>
          </button>
        ),
    },
    {
      id: "actions",
      header: "",
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          {!row.original.is_active && (
            <Button
              variant="outline"
              size="icon"
              className="size-8 text-green-600 hover:text-green-600"
              title="Set as active year"
              onClick={() => activate(row.original)}
            >
              <CheckCircle2Icon className="size-3.5" />
            </Button>
          )}
          <Button variant="outline" size="icon" className="size-8" onClick={() => openEdit(row.original)}>
            <PencilIcon className="size-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8 text-destructive hover:text-destructive"
            disabled={deletingId === row.original.id}
            onClick={() => handleDelete(row.original)}
          >
            <Trash2Icon className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  const active = years.find((y) => y.is_active)

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      {/* breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Financial Year</h1>
        <p className="text-sm text-muted-foreground">Om Casting &rsaquo; Backup &rsaquo; Financial Year</p>
      </div>

      <p className="text-sm text-muted-foreground">
        Define each year&apos;s start and end dates. The active year sets the default date range used across
        ledger and report pages.
        {active && (
          <>
            {" "}Currently active: <span className="font-medium text-foreground">{active.label}</span>{" "}
            ({fmtDate(active.start_date)} – {fmtDate(active.end_date)}).
          </>
        )}
      </p>

      <ListTable
        columns={columns as ColumnDef<FinancialYear, unknown>[]}
        data={years}
        loading={loading}
        emptyMessage="No financial years yet. Add one to get started."
        toolbarStart={
          <Button onClick={openAdd}>
            <PlusIcon className="size-4" /> Add Financial Year
          </Button>
        }
        exportConfig={{
          name: "financial-years",
          headers: ["#", "Year", "Start Date", "End Date", "Status"],
          row: (y, i) => [i + 1, y.label, fmtDate(y.start_date), fmtDate(y.end_date), y.is_active ? "Active" : ""],
        }}
      />

      {/* add / edit modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Financial Year" : "Add Financial Year"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <fieldset disabled={saving} className="contents">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="fy-label">
                  Year Label <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="fy-label"
                  placeholder="e.g. 2025-26"
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="fy-start">
                    Start Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="fy-start"
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="fy-end">
                    End Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="fy-end"
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4 accent-primary"
                  checked={makeActive}
                  onChange={(e) => setMakeActive(e.target.checked)}
                />
                Set as the active financial year
              </label>
              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : editingId ? "Update" : "Add"}
                </Button>
              </DialogFooter>
            </fieldset>
          </form>
        </DialogContent>
      </Dialog>

      {/* copyright footer */}
      <div className="mt-auto flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">
        <span>2020 - 2026 &copy; OM CASTING</span>
        <span>POWERED BY LARK INFOWAY.</span>
      </div>
    </div>
  )
}
