"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import { ArrowUpDownIcon, PencilIcon, Trash2Icon, PrinterIcon, CopyIcon, FileSpreadsheetIcon } from "lucide-react"
import { toast } from "sonner"

import { useConfirm } from "@/components/confirm-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type Payment = {
  id: number
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
  const [parties, setParties] = React.useState<string[]>([])
  const [form, setForm] = React.useState(emptyForm())
  const [editingId, setEditingId] = React.useState<number | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [deletingId, setDeletingId] = React.useState<number | null>(null)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = React.useState("")

  React.useEffect(() => {
    fetch("/api/payments")
      .then(async (r) => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error ?? "Failed to load payments")
        if (Array.isArray(data)) setPayments(data)
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load payments"))

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

  function handlePrint() {
    window.print()
  }

  function handleCopy() {
    const text = payments
      .map((p, i) => `${i + 1}\t${p.bill_type}\t${p.party}\t${fmtDate(p.pay_date)}\t${p.rs}\t${p.fine}\t${p.remark ?? ""}`)
      .join("\n")
    navigator.clipboard.writeText(`#\tBill Type\tParty\tDate\tRs\tFine\tRemark\n${text}`)
    toast.success("Table copied to clipboard")
  }

  function handleExcel() {
    const header = "#,Bill Type,Party,Date,Rs,Fine,Remark"
    const rows = payments.map(
      (p, i) => `${i + 1},${p.bill_type},${p.party},${fmtDate(p.pay_date)},${p.rs},${p.fine},"${p.remark ?? ""}"`,
    )
    const csv = [header, ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "payments.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const columns: ColumnDef<Payment>[] = [
    {
      id: "serial",
      header: "#",
      cell: ({ row }) => row.index + 1,
      enableSorting: false,
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

  const table = useReactTable({
    data: payments,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  })

  const { pageIndex, pageSize } = table.getState().pagination
  const totalFiltered = table.getFilteredRowModel().rows.length
  const from = totalFiltered === 0 ? 0 : pageIndex * pageSize + 1
  const to = Math.min((pageIndex + 1) * pageSize, totalFiltered)

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* breadcrumb */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Rough Payment</h1>
        <p className="text-sm text-muted-foreground">Om Casting &rsaquo; Rough Payment</p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* ── LEFT: form ── */}
        <div className="w-full rounded-lg border bg-card p-6 lg:w-96 shrink-0">
          <h2 className="mb-5 text-center text-sm font-bold uppercase tracking-widest text-muted-foreground">
            {editingId ? "Edit Payment" : "Add Payment"}
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
              <Select
                value={form.party}
                onValueChange={(v) => { if (v) setForm((f) => ({ ...f, party: v })) }}
                items={parties.map((p) => ({ label: p, value: p }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="None" />
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
          </form>
        </div>

        {/* ── RIGHT: table ── */}
        <div className="flex-1 rounded-lg border bg-card p-4">
          {/* toolbar */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <PrinterIcon className="size-4" /> Print
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopy}>
                <CopyIcon className="size-4" /> Copy
              </Button>
              <Button variant="outline" size="sm" onClick={handleExcel}>
                <FileSpreadsheetIcon className="size-4" /> Excel
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="outline" size="sm">Column Visibility ▾</Button>} />
                <DropdownMenuContent align="end">
                  {table.getAllColumns().filter((c) => c.getCanHide()).map((col) => (
                    <DropdownMenuCheckboxItem
                      key={col.id}
                      className="capitalize"
                      checked={col.getIsVisible()}
                      onCheckedChange={(v) => col.toggleVisibility(!!v)}
                    >
                      {col.id.replace("_", " ")}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="search" className="text-sm">Search:</Label>
              <Input
                id="search"
                className="h-8 w-48"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
              />
            </div>
          </div>

          {/* table */}
          <div className="overflow-hidden rounded border">
            <Table>
              <TableHeader className="bg-muted">
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id}>
                    {hg.headers.map((h) => (
                      <TableHead key={h.id} className="text-xs font-semibold uppercase">
                        {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                      No payments found.
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} className="hover:bg-muted/40">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-2">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* footer */}
          <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Showing {from} to {to} of {totalFiltered} entries
            </span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-8" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                Previous
              </Button>
              <span className="flex size-8 items-center justify-center rounded border bg-primary text-xs font-medium text-primary-foreground">
                {pageIndex + 1}
              </span>
              <Button variant="outline" size="sm" className="h-8" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                Next
              </Button>
            </div>
          </div>
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
