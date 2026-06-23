"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
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
import { useActiveFinancialYear, filterByFinancialYear } from "@/lib/use-financial-year"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type Garanu = {
  id: number
  inv_date: string
  party: string
  fine: string
  g_weight: string
  total_f: string
  created_at: string
}

function fmtDate(iso: string) {
  if (!iso) return ""
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}

const inr = (v: unknown) => Number(v).toLocaleString("en-IN")

export default function GaranuPage() {
  const router = useRouter()
  const confirm = useConfirm()
  const [garanus, setGaranus] = React.useState<Garanu[]>([])
  const [deletingId, setDeletingId] = React.useState<number | null>(null)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = React.useState("")
  const fy = useActiveFinancialYear()
  const shown = React.useMemo(() => filterByFinancialYear(garanus, "inv_date", fy), [garanus, fy])

  React.useEffect(() => {
    fetch("/api/garanus")
      .then(async (r) => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error ?? "Failed to load garanus")
        if (Array.isArray(data)) setGaranus(data)
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load garanus"))
  }, [])

  async function handleDelete(id: number) {
    const ok = await confirm({
      title: "Delete garanu?",
      description: "This will permanently remove the garanu entry. This action cannot be undone.",
      confirmText: "Delete",
      destructive: true,
    })
    if (!ok) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/garanus/${id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Delete failed")
      setGaranus((prev) => prev.filter((g) => g.id !== id))
      toast.success("Garanu deleted")
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
    const text = shown
      .map((g, i) => `${i + 1}\t${fmtDate(g.inv_date)}\t${g.party}\t${g.fine}\t${g.total_f}`)
      .join("\n")
    navigator.clipboard.writeText(`#\tDate\tParty\tFine\tTotal F\n${text}`)
    toast.success("Table copied to clipboard")
  }

  function handleExcel() {
    const header = "#,Date,Party,Fine,Total F"
    const rows = shown.map((g, i) => `${i + 1},${fmtDate(g.inv_date)},"${g.party}",${g.fine},${g.total_f}`)
    const csv = [header, ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "garanu.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const columns: ColumnDef<Garanu>[] = [
    {
      id: "serial",
      header: "#",
      cell: ({ row }) => row.index + 1,
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "inv_date",
      header: ({ column }) => (
        <button className="flex items-center gap-1 hover:text-foreground" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Date <ArrowUpDownIcon className="size-3" />
        </button>
      ),
      cell: ({ row }) => fmtDate(row.original.inv_date),
    },
    {
      accessorKey: "party",
      header: ({ column }) => (
        <button className="flex items-center gap-1 hover:text-foreground" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Party <ArrowUpDownIcon className="size-3" />
        </button>
      ),
    },
    {
      accessorKey: "fine",
      header: ({ column }) => (
        <button className="flex items-center gap-1 hover:text-foreground" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Fine <ArrowUpDownIcon className="size-3" />
        </button>
      ),
      cell: ({ row }) => inr(row.original.fine),
    },
    {
      accessorKey: "total_f",
      header: ({ column }) => (
        <button className="flex items-center gap-1 hover:text-foreground" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Total F <ArrowUpDownIcon className="size-3" />
        </button>
      ),
      cell: ({ row }) => inr(row.original.total_f),
    },
    {
      id: "actions",
      header: "",
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => router.push(`/dashboard/invoice/garanu/add?id=${row.original.id}`)}
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
    data: shown,
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
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">GARANU</h1>
        <p className="text-sm text-muted-foreground">Om Casting &rsaquo; Garanu</p>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <div className="mb-4 flex flex-wrap gap-2">
          <Button onClick={() => router.push("/dashboard/invoice/garanu/add")}>Add Garanu</Button>
        </div>

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
                    No garanus found.
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

        <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
          <span>Showing {from} to {to} of {totalFiltered} entries</span>
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

      <div className="mt-auto flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">
        <span>2020 - 2026 &copy; OM CASTING</span>
        <span>POWERED BY LARK INFOWAY.</span>
      </div>
    </div>
  )
}
