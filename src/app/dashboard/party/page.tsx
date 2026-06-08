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

type Party = {
  id: number
  party_name: string
  mobile: string | null
  address: string | null
  opening_fine: string
  opening_amount: string
  city: string | null
  party_type: string
  state: string | null
  status: string
  created_at: string
}

type Option = { id: number; name: string }

const PARTY_TYPES = ["Vepari", "Karigar", "Customer", "Supplier", "Other"]

const EMPTY = {
  party_name: "",
  mobile: "",
  address: "",
  opening_fine: "",
  opening_amount: "",
  city: "",
  party_type: "Vepari",
  state: "",
}

export default function PartyPage() {
  const confirm = useConfirm()
  const [parties, setParties] = React.useState<Party[]>([])
  const [cities, setCities] = React.useState<Option[]>([])
  const [states, setStates] = React.useState<Option[]>([])
  const [form, setForm] = React.useState(EMPTY)
  const [editingId, setEditingId] = React.useState<number | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [deletingId, setDeletingId] = React.useState<number | null>(null)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = React.useState("")

  React.useEffect(() => {
    fetch("/api/parties")
      .then(async (r) => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error ?? "Failed to load parties")
        if (Array.isArray(data)) setParties(data)
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load parties"))

    fetch("/api/cities")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCities(data.filter((c) => c.status === "Active").map((c) => ({ id: c.id, name: c.city_name })))
        }
      })
      .catch(() => {})

    fetch("/api/states")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setStates(data.filter((s) => s.status === "Active").map((s) => ({ id: s.id, name: s.state_name })))
        }
      })
      .catch(() => {})
  }, [])

  function startEdit(p: Party) {
    setEditingId(p.id)
    setForm({
      party_name: p.party_name,
      mobile: p.mobile ?? "",
      address: p.address ?? "",
      opening_fine: p.opening_fine ?? "",
      opening_amount: p.opening_amount ?? "",
      city: p.city ?? "",
      party_type: p.party_type,
      state: p.state ?? "",
    })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(EMPTY)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.party_name.trim() || !form.city || !form.party_type || !form.state) {
      toast.error("Party name, city, party type and state are required")
      return
    }
    setSaving(true)
    try {
      if (editingId !== null) {
        const res = await fetch(`/api/parties/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
        const updated = await res.json()
        if (!res.ok) throw new Error(updated.error ?? "Update failed")
        setParties((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
        toast.success("Party updated")
        cancelEdit()
      } else {
        const res = await fetch("/api/parties", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
        const created = await res.json()
        if (!res.ok) throw new Error(created.error ?? "Create failed")
        setParties((prev) => [...prev, created])
        toast.success("Party added")
        setForm(EMPTY)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    const ok = await confirm({
      title: "Delete party?",
      description: "This will permanently remove the party. This action cannot be undone.",
      confirmText: "Delete",
      destructive: true,
    })
    if (!ok) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/parties/${id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Delete failed")
      setParties((prev) => prev.filter((p) => p.id !== id))
      toast.success("Party deleted")
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
    const text = parties
      .map((p, i) => `${i + 1}\t${p.party_name}\t${p.mobile ?? ""}\t${p.address ?? ""}\t${p.city ?? ""}`)
      .join("\n")
    navigator.clipboard.writeText(`#\tParty Name\tMobile No.\tAddress\tCity\n${text}`)
    toast.success("Table copied to clipboard")
  }

  function handleExcel() {
    const header = "#,Party Name,Mobile No.,Address,City,Party Type,State"
    const rows = parties.map(
      (p, i) =>
        `${i + 1},${p.party_name},${p.mobile ?? ""},"${p.address ?? ""}",${p.city ?? ""},${p.party_type},${p.state ?? ""}`,
    )
    const csv = [header, ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "parties.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const columns: ColumnDef<Party>[] = [
    {
      id: "serial",
      header: "#",
      cell: ({ row }) => row.index + 1,
      enableSorting: false,
    },
    {
      accessorKey: "party_name",
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Party Name <ArrowUpDownIcon className="size-3" />
        </button>
      ),
    },
    {
      accessorKey: "mobile",
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Mobile No. <ArrowUpDownIcon className="size-3" />
        </button>
      ),
      cell: ({ row }) => row.original.mobile || "—",
    },
    {
      accessorKey: "address",
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Address <ArrowUpDownIcon className="size-3" />
        </button>
      ),
      cell: ({ row }) => row.original.address || "—",
    },
    {
      accessorKey: "city",
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 hover:text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          City <ArrowUpDownIcon className="size-3" />
        </button>
      ),
      cell: ({ row }) => row.original.city || "—",
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => startEdit(row.original)}
          >
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
    data: parties,
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
        <h1 className="text-xl font-semibold">Party</h1>
        <p className="text-sm text-muted-foreground">Om Casting &rsaquo; Party</p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* ── LEFT: form ── */}
        <div className="w-full rounded-lg border bg-card p-6 lg:w-96 shrink-0">
          <h2 className="mb-5 text-center text-sm font-bold uppercase tracking-widest text-muted-foreground">
            {editingId ? "Edit Party" : "Add Party"}
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field label="Party Name" required>
              <Input
                placeholder="Party Name"
                value={form.party_name}
                onChange={(e) => setForm((f) => ({ ...f, party_name: e.target.value }))}
                required
              />
            </Field>

            <Field label="Mobile Number">
              <Input
                placeholder="Mobile Number"
                value={form.mobile}
                onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))}
              />
            </Field>

            <Field label="Address">
              <textarea
                placeholder="Address"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
              />
            </Field>

            <Field label="Opening Fine">
              <Input
                type="number"
                step="0.001"
                placeholder="Fine"
                value={form.opening_fine}
                onChange={(e) => setForm((f) => ({ ...f, opening_fine: e.target.value }))}
              />
            </Field>

            <Field label="Opening Amount">
              <Input
                type="number"
                step="0.01"
                placeholder="Amount"
                value={form.opening_amount}
                onChange={(e) => setForm((f) => ({ ...f, opening_amount: e.target.value }))}
              />
            </Field>

            <Field label="City" required>
              <DropdownField
                placeholder="None"
                value={form.city}
                onChange={(v) => setForm((f) => ({ ...f, city: v }))}
                options={cities.map((c) => c.name)}
              />
            </Field>

            <Field label="Party Type" required>
              <DropdownField
                placeholder="Select type"
                value={form.party_type}
                onChange={(v) => setForm((f) => ({ ...f, party_type: v }))}
                options={PARTY_TYPES}
              />
            </Field>

            <Field label="State" required>
              <DropdownField
                placeholder="None"
                value={form.state}
                onChange={(v) => setForm((f) => ({ ...f, state: v }))}
                options={states.map((s) => s.name)}
              />
            </Field>

            <div className="flex gap-2 pt-1">
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? "Saving…" : editingId ? "Edit Party" : "Register"}
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
                      No parties found.
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
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <span className="flex size-8 items-center justify-center rounded border bg-primary text-xs font-medium text-primary-foreground">
                {pageIndex + 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
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

/* ── small helpers ── */

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
    <div className="grid grid-cols-[110px_1fr] items-start gap-3">
      <Label className="pt-2 text-sm">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <div>{children}</div>
    </div>
  )
}

function DropdownField({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
  placeholder: string
}) {
  return (
    <Select
      value={value}
      onValueChange={(v) => { if (v) onChange(v) }}
      items={options.map((o) => ({ label: o, value: o }))}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {options.length === 0 ? (
            <SelectItem value="__none" disabled>
              No options
            </SelectItem>
          ) : (
            options.map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))
          )}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
