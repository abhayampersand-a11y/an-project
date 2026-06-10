"use client"

import * as React from "react"
import { type ColumnDef } from "@tanstack/react-table"
import { ArrowUpDownIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { useConfirm } from "@/components/confirm-dialog"
import { ListTable } from "@/components/list-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Item = {
  id: number
  item_name: string
  status: string
  created_at: string
}

export default function ItemPage() {
  const confirm = useConfirm()
  const [items, setItems] = React.useState<Item[]>([])
  const [loading, setLoading] = React.useState(true)
  const [name, setName] = React.useState("")
  const [editingId, setEditingId] = React.useState<number | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [deletingId, setDeletingId] = React.useState<number | null>(null)

  React.useEffect(() => {
    fetch("/api/items")
      .then(async (r) => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error ?? "Failed to load items")
        if (Array.isArray(data)) setItems(data)
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load items"))
      .finally(() => setLoading(false))
  }, [])

  function startEdit(item: Item) {
    setEditingId(item.id)
    setName(item.item_name)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function cancelEdit() {
    setEditingId(null)
    setName("")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Item name is required")
      return
    }
    setSaving(true)
    try {
      if (editingId !== null) {
        const res = await fetch(`/api/items/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ item_name: name }),
        })
        const updated = await res.json()
        if (!res.ok) throw new Error(updated.error ?? "Update failed")
        setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)))
        toast.success("Item updated")
        cancelEdit()
      } else {
        const res = await fetch("/api/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ item_name: name }),
        })
        const created = await res.json()
        if (!res.ok) throw new Error(created.error ?? "Create failed")
        setItems((prev) => [...prev, created])
        toast.success("Item added")
        setName("")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    const ok = await confirm({
      title: "Delete item?",
      description: "This will permanently remove the item. This action cannot be undone.",
      confirmText: "Delete",
      destructive: true,
    })
    if (!ok) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/items/${id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Delete failed")
      setItems((prev) => prev.filter((it) => it.id !== id))
      toast.success("Item deleted")
      if (editingId === id) cancelEdit()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error")
    } finally {
      setDeletingId(null)
    }
  }

  async function toggleStatus(item: Item) {
    const newStatus = item.status === "Active" ? "Inactive" : "Active"
    try {
      const res = await fetch(`/api/items/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      const updated = await res.json()
      if (!res.ok) throw new Error(updated.error ?? "Failed")
      setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)))
    } catch {
      toast.error("Failed to update status")
    }
  }

  const columns: ColumnDef<Item>[] = [
    {
      id: "serial",
      header: "#",
      cell: ({ row }) => row.index + 1,
      enableSorting: false,
    },
    {
      accessorKey: "item_name",
      header: ({ column }) => (
        <button className="flex items-center gap-1 hover:text-foreground" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Item Name <ArrowUpDownIcon className="size-3" />
        </button>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <button className="flex items-center gap-1 hover:text-foreground" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Status <ArrowUpDownIcon className="size-3" />
        </button>
      ),
      cell: ({ row }) => (
        <button onClick={() => toggleStatus(row.original)}>
          <Badge
            variant="outline"
            className={
              row.original.status === "Active"
                ? "cursor-pointer border-green-500 text-green-600 dark:text-green-400"
                : "cursor-pointer border-red-400 text-red-500"
            }
          >
            {row.original.status}
          </Badge>
        </button>
      ),
    },
    {
      id: "actions",
      header: "Action",
      enableHiding: false,
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
        <h1 className="text-xl font-semibold">Item</h1>
        <p className="text-sm text-muted-foreground">Om Casting &rsaquo; Item</p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* ── LEFT: form ── */}
        <div className="w-full rounded-lg border bg-card p-4 md:p-6 lg:w-96 shrink-0">
          <h2 className="mb-5 text-center text-sm font-bold uppercase tracking-widest text-muted-foreground">
            {editingId ? "Edit Item" : "Add Item"}
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <fieldset disabled={saving} className="contents">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="item_name">
                  Item Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="item_name"
                  placeholder="Item Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-2 pt-1">
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? "Saving…" : editingId ? "Edit Item" : "Add"}
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
            columns={columns as ColumnDef<Item, unknown>[]}
            data={items}
            loading={loading}
            emptyMessage="No items found."
            exportConfig={{
              name: "items",
              headers: ["#", "Item Name", "Status"],
              row: (it, i) => [i + 1, it.item_name, it.status],
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
