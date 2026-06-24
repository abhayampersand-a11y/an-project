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
import { PrinterIcon, CopyIcon, FileSpreadsheetIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
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

/** Drives the Copy / Excel / Print export buttons. Omit to hide them. */
export type ExportConfig<T> = {
  /** File/clipboard base name, e.g. "cities". */
  name: string
  /** Column headers in export order. */
  headers: string[]
  /** Cell values for one row, in the same order as `headers`. */
  row: (item: T, index: number) => (string | number)[]
}

type ListTableProps<T> = {
  columns: ColumnDef<T, unknown>[]
  data: T[]
  /** Shows skeleton rows while the backing API call is in flight. */
  loading?: boolean
  emptyMessage?: string
  /** Extra content (e.g. Add buttons) shown above the toolbar. */
  toolbarStart?: React.ReactNode
  exportConfig?: ExportConfig<T>
  pageSize?: number
  searchPlaceholder?: string
}

export function ListTable<T>({
  columns,
  data,
  loading = false,
  emptyMessage = "No records found.",
  toolbarStart,
  exportConfig,
  pageSize = 10,
  searchPlaceholder = "",
}: ListTableProps<T>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = React.useState("")

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  })

  const { pageIndex, pageSize: ps } = table.getState().pagination
  const totalFiltered = table.getFilteredRowModel().rows.length
  const from = totalFiltered === 0 ? 0 : pageIndex * ps + 1
  const to = Math.min((pageIndex + 1) * ps, totalFiltered)
  const colCount = table.getVisibleLeafColumns().length

  function handleCopy() {
    if (!exportConfig) return
    const body = data.map((item, i) => exportConfig.row(item, i).join("\t")).join("\n")
    navigator.clipboard.writeText(`${exportConfig.headers.join("\t")}\n${body}`)
    toast.success("Table copied to clipboard")
  }

  function handleExcel() {
    if (!exportConfig) return
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
    const csv = [
      exportConfig.headers.join(","),
      ...data.map((item, i) => exportConfig.row(item, i).map(esc).join(",")),
    ].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${exportConfig.name}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      {toolbarStart && <div className="mb-4 flex flex-wrap gap-2">{toolbarStart}</div>}

      {/* toolbar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {exportConfig && (
            <>
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <PrinterIcon className="size-4" /> Print
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopy}>
                <CopyIcon className="size-4" /> Copy
              </Button>
              <Button variant="outline" size="sm" onClick={handleExcel}>
                <FileSpreadsheetIcon className="size-4" /> Excel
              </Button>
            </>
          )}
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
                  {col.id.replace(/_/g, " ")}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="list-search" className="text-sm">Search:</Label>
          <Input
            id="list-search"
            className="h-8 w-48"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={searchPlaceholder}
          />
        </div>
      </div>

      {/* table */}
      <div className="overflow-x-auto rounded border">
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
            {loading ? (
              Array.from({ length: Math.min(pageSize, 8) }).map((_, r) => (
                <TableRow key={`sk-${r}`}>
                  {Array.from({ length: colCount }).map((__, c) => (
                    <TableCell key={c} className="py-3">
                      <Skeleton className="h-4 w-full max-w-[160px]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colCount} className="h-24 text-center text-muted-foreground">
                  {emptyMessage}
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
  )
}
