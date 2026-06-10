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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type State = {
  id: number
  state_name: string
  state_code: string
  country: string
  status: string
  created_at: string
}

const EMPTY = { state_name: "", state_code: "", country: "India" }

const COUNTRIES = ["India", "USA", "UK", "UAE", "Canada", "Australia"]

export default function StatePage() {
  const confirm = useConfirm()
  const [states, setStates] = React.useState<State[]>([])
  const [loading, setLoading] = React.useState(true)
  const [form, setForm] = React.useState(EMPTY)
  const [editingId, setEditingId] = React.useState<number | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [deletingId, setDeletingId] = React.useState<number | null>(null)

  React.useEffect(() => {
    fetch("/api/states")
      .then(async (r) => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error ?? "Failed to load states")
        if (Array.isArray(data)) setStates(data)
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load states"))
      .finally(() => setLoading(false))
  }, [])

  function startEdit(state: State) {
    setEditingId(state.id)
    setForm({ state_name: state.state_name, state_code: state.state_code, country: state.country })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(EMPTY)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.state_name.trim() || !form.country) {
      toast.error("State name and country are required")
      return
    }
    setSaving(true)
    try {
      if (editingId !== null) {
        const res = await fetch(`/api/states/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
        const updated = await res.json()
        if (!res.ok) throw new Error(updated.error ?? "Update failed")
        setStates((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
        toast.success("State updated")
        cancelEdit()
      } else {
        const res = await fetch("/api/states", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
        const created = await res.json()
        if (!res.ok) throw new Error(created.error ?? "Create failed")
        setStates((prev) => [...prev, created])
        toast.success("State added")
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
      title: "Delete state?",
      description: "This will permanently remove the state. This action cannot be undone.",
      confirmText: "Delete",
      destructive: true,
    })
    if (!ok) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/states/${id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Delete failed")
      setStates((prev) => prev.filter((s) => s.id !== id))
      toast.success("State deleted")
      if (editingId === id) cancelEdit()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error")
    } finally {
      setDeletingId(null)
    }
  }

  async function toggleStatus(state: State) {
    const newStatus = state.status === "Active" ? "Inactive" : "Active"
    try {
      const res = await fetch(`/api/states/${state.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const updated: State = await res.json()
      setStates((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
    } catch {
      toast.error("Failed to update status")
    }
  }

  const columns: ColumnDef<State>[] = [
    {
      id: "serial",
      header: "#",
      cell: ({ row }) => row.index + 1,
      enableSorting: false,
    },
    {
      accessorKey: "state_name",
      header: ({ column }) => (
        <button className="flex items-center gap-1 hover:text-foreground" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          State Name <ArrowUpDownIcon className="size-3" />
        </button>
      ),
    },
    {
      accessorKey: "state_code",
      header: ({ column }) => (
        <button className="flex items-center gap-1 hover:text-foreground" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          State Code <ArrowUpDownIcon className="size-3" />
        </button>
      ),
    },
    {
      accessorKey: "country",
      header: ({ column }) => (
        <button className="flex items-center gap-1 hover:text-foreground" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Country <ArrowUpDownIcon className="size-3" />
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
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      {/* breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">State</h1>
        <p className="text-sm text-muted-foreground">Om Casting &rsaquo; Setting &rsaquo; State</p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* ── LEFT: form ── */}
        <div className="w-full rounded-lg border bg-card p-4 md:p-6 lg:w-80 shrink-0">
          <h2 className="mb-5 text-center text-sm font-bold uppercase tracking-widest text-muted-foreground">
            {editingId ? "Edit State" : "Add State"}
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <fieldset disabled={saving} className="contents">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="state_name">
                  State Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="state_name"
                  placeholder="State Name"
                  value={form.state_name}
                  onChange={(e) => setForm((f) => ({ ...f, state_name: e.target.value }))}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="state_code">State Code</Label>
                <Input
                  id="state_code"
                  placeholder="Code"
                  value={form.state_code}
                  onChange={(e) => setForm((f) => ({ ...f, state_code: e.target.value }))}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="country">
                  Country <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.country}
                  onValueChange={(v) => { if (v) setForm((f) => ({ ...f, country: v })) }}
                  items={COUNTRIES.map((c) => ({ label: c, value: c }))}
                >
                  <SelectTrigger id="country" className="w-full">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-1">
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? "Saving…" : editingId ? "Edit State" : "Add State"}
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
            columns={columns as ColumnDef<State, unknown>[]}
            data={states}
            loading={loading}
            emptyMessage="No states found."
            exportConfig={{
              name: "states",
              headers: ["#", "State Name", "State Code", "Country", "Status"],
              row: (s, i) => [i + 1, s.state_name, s.state_code, s.country, s.status],
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
