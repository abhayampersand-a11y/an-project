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

type City = {
  id: number
  city_name: string
  city_code: string
  status: string
  created_at: string
}

const EMPTY = { city_name: "", city_code: "" }

export default function CityPage() {
  const confirm = useConfirm()
  const [cities, setCities] = React.useState<City[]>([])
  const [loading, setLoading] = React.useState(true)
  const [form, setForm] = React.useState(EMPTY)
  const [editingId, setEditingId] = React.useState<number | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [deletingId, setDeletingId] = React.useState<number | null>(null)

  React.useEffect(() => {
    fetch("/api/cities")
      .then(async (r) => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error ?? "Failed to load cities")
        if (Array.isArray(data)) setCities(data)
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load cities"))
      .finally(() => setLoading(false))
  }, [])

  function startEdit(city: City) {
    setEditingId(city.id)
    setForm({ city_name: city.city_name, city_code: city.city_code })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(EMPTY)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.city_name.trim()) {
      toast.error("City name is required")
      return
    }
    setSaving(true)
    try {
      if (editingId !== null) {
        const res = await fetch(`/api/cities/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
        const updated = await res.json()
        if (!res.ok) throw new Error(updated.error ?? "Update failed")
        setCities((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
        toast.success("City updated")
        cancelEdit()
      } else {
        const res = await fetch("/api/cities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
        const created = await res.json()
        if (!res.ok) throw new Error(created.error ?? "Create failed")
        setCities((prev) => [...prev, created])
        toast.success("City added")
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
      title: "Delete city?",
      description: "This will permanently remove the city. This action cannot be undone.",
      confirmText: "Delete",
      destructive: true,
    })
    if (!ok) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/cities/${id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Delete failed")
      setCities((prev) => prev.filter((c) => c.id !== id))
      toast.success("City deleted")
      if (editingId === id) cancelEdit()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error")
    } finally {
      setDeletingId(null)
    }
  }

  async function toggleStatus(city: City) {
    const newStatus = city.status === "Active" ? "Inactive" : "Active"
    try {
      const res = await fetch(`/api/cities/${city.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      const updated = await res.json()
      if (!res.ok) throw new Error(updated.error ?? "Failed")
      setCities((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
    } catch {
      toast.error("Failed to update status")
    }
  }

  const columns: ColumnDef<City>[] = [
    {
      id: "serial",
      header: "#",
      cell: ({ row }) => row.index + 1,
      enableSorting: false,
    },
    {
      accessorKey: "city_name",
      header: ({ column }) => (
        <button className="flex items-center gap-1 hover:text-foreground" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          City Name <ArrowUpDownIcon className="size-3" />
        </button>
      ),
    },
    {
      accessorKey: "city_code",
      header: ({ column }) => (
        <button className="flex items-center gap-1 hover:text-foreground" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          City Code <ArrowUpDownIcon className="size-3" />
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
      header: "",
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="size-8" onClick={() => startEdit(row.original)}>
            <PencilIcon className="size-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8 text-destructive hover:text-destructive"
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
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* breadcrumb */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">City</h1>
        <p className="text-sm text-muted-foreground">Om Casting &rsaquo; Setting &rsaquo; City</p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* ── LEFT: form ── */}
        <div className="w-full rounded-lg border bg-card p-6 lg:w-80 shrink-0">
          <h2 className="mb-5 text-center text-sm font-bold uppercase tracking-widest text-muted-foreground">
            {editingId ? "Edit City" : "Add City"}
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <fieldset disabled={saving} className="contents">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="city_name">
                  City Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="city_name"
                  placeholder="City Name"
                  value={form.city_name}
                  onChange={(e) => setForm((f) => ({ ...f, city_name: e.target.value }))}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="city_code">Code</Label>
                <Input
                  id="city_code"
                  placeholder="Code"
                  value={form.city_code}
                  onChange={(e) => setForm((f) => ({ ...f, city_code: e.target.value }))}
                />
              </div>

              <div className="flex gap-2 pt-1">
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? "Saving…" : editingId ? "Edit City" : "Add City"}
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
            columns={columns as ColumnDef<City, unknown>[]}
            data={cities}
            loading={loading}
            emptyMessage="No cities found."
            exportConfig={{
              name: "cities",
              headers: ["#", "City Name", "City Code", "Status"],
              row: (c, i) => [i + 1, c.city_name, c.city_code, c.status],
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
