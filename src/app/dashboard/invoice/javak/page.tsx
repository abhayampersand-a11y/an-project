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
import { ArrowUpDownIcon, PencilIcon, Trash2Icon, EyeIcon, PrinterIcon, CopyIcon, FileSpreadsheetIcon } from "lucide-react"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type JavakItem = {
  item: string
  tr: number
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
  type: string // 'w' = wastage, 'g' = ghat
  bill_type: string
  inv_date: string
  invoice_no: string
  party: string
  items: JavakItem[]
  fine: string
  labour: string
  previous_amount: string
  previous_fine: string
  closing_amount: string
  closing_fine: string
  remark: string | null
  created_at: string
}

/** YYYY-MM-DD -> DD/MM/YYYY for display. */
function fmtDate(iso: string) {
  if (!iso) return ""
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}

const inr = (v: unknown) => Number(v).toLocaleString("en-IN")

export default function JavakPage() {
  const router = useRouter()
  const confirm = useConfirm()
  const [javaks, setJavaks] = React.useState<Javak[]>([])
  const [deletingId, setDeletingId] = React.useState<number | null>(null)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = React.useState("")

  React.useEffect(() => {
    fetch("/api/javaks")
      .then(async (r) => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error ?? "Failed to load javaks")
        if (Array.isArray(data)) setJavaks(data)
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load javaks"))
  }, [])

  async function handleDelete(id: number) {
    const ok = await confirm({
      title: "Delete javak?",
      description: "This will permanently remove the javak entry. This action cannot be undone.",
      confirmText: "Delete",
      destructive: true,
    })
    if (!ok) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/javaks/${id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Delete failed")
      setJavaks((prev) => prev.filter((j) => j.id !== id))
      toast.success("Javak deleted")
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
    const text = javaks
      .map((j, i) => `${i + 1}\t${j.type}\t${fmtDate(j.inv_date)}\t${j.invoice_no}\t${j.party}\t${j.fine}\t${j.labour}`)
      .join("\n")
    navigator.clipboard.writeText(`#\ttype\tDate\tInvoice No\tM/s\tFine\tLabour\n${text}`)
    toast.success("Table copied to clipboard")
  }

  function handleExcel() {
    const header = "#,type,Date,Invoice No,M/s,Fine,Labour"
    const rows = javaks.map(
      (j, i) => `${i + 1},${j.type},${fmtDate(j.inv_date)},${j.invoice_no},"${j.party}",${j.fine},${j.labour}`,
    )
    const csv = [header, ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "javak.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const columns: ColumnDef<Javak>[] = [
    {
      id: "serial",
      header: "#",
      cell: ({ row }) => row.index + 1,
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "type",
      header: ({ column }) => (
        <button className="flex items-center gap-1 hover:text-foreground" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          type <ArrowUpDownIcon className="size-3" />
        </button>
      ),
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={
            row.original.type === "w"
              ? "border-amber-400 text-amber-600 dark:text-amber-400"
              : "border-sky-400 text-sky-600 dark:text-sky-400"
          }
        >
          {row.original.type}
        </Badge>
      ),
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
      accessorKey: "invoice_no",
      header: ({ column }) => (
        <button className="flex items-center gap-1 hover:text-foreground" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Invoice No <ArrowUpDownIcon className="size-3" />
        </button>
      ),
    },
    {
      accessorKey: "party",
      header: ({ column }) => (
        <button className="flex items-center gap-1 hover:text-foreground" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          M/s <ArrowUpDownIcon className="size-3" />
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
      accessorKey: "labour",
      header: ({ column }) => (
        <button className="flex items-center gap-1 hover:text-foreground" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Labour <ArrowUpDownIcon className="size-3" />
        </button>
      ),
      cell: ({ row }) => inr(row.original.labour),
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
            onClick={() =>
              router.push(
                `/dashboard/invoice/javak/${row.original.type === "g" ? "ghat" : "wastage"}?id=${row.original.id}`,
              )
            }
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
          <Button
            size="icon"
            className="size-8 bg-blue-500 text-white hover:bg-blue-600"
            onClick={() => router.push(`/dashboard/invoice/javak/print/${row.original.id}`)}
          >
            <EyeIcon className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  const table = useReactTable({
    data: javaks,
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
      {/* breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">JAVAK</h1>
        <p className="text-sm text-muted-foreground">Om Casting &rsaquo; Javak</p>
      </div>

      <div className="rounded-lg border bg-card p-4">
        {/* top action buttons */}
        <div className="mb-4 flex flex-wrap gap-2">
          <Button onClick={() => router.push("/dashboard/invoice/javak/wastage")}>Javak Wastage</Button>
          <Button onClick={() => router.push("/dashboard/invoice/javak/ghat")}>Javak Ghat</Button>
        </div>

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
                    No javaks found.
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

      {/* copyright footer */}
      <div className="mt-auto flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">
        <span>2020 - 2026 &copy; OM CASTING</span>
        <span>POWERED BY LARK INFOWAY.</span>
      </div>
    </div>
  )
}
