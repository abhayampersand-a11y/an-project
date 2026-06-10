"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"
import { PencilIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useConfirm } from "@/components/confirm-dialog"
import { RichTextEditor } from "@/components/rich-text-editor"

type Sticky = { id: number; party_name: string; content: string | null; created_at: string }

type TopButton = { label: string; tone: "red" | "dark"; href?: string; action?: "sticky" }

export function DashboardHome() {
  const confirm = useConfirm()
  const [notes, setNotes] = React.useState<Sticky[]>([])
  const [modalOpen, setModalOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Sticky | null>(null)
  const [partyName, setPartyName] = React.useState("")
  const [content, setContent] = React.useState("")
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    fetch("/api/sticky-notes")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setNotes(d) })
      .catch(() => {})
  }, [])

  function openAdd() {
    setEditing(null)
    setPartyName("")
    setContent("")
    setModalOpen(true)
  }

  function openEdit(n: Sticky) {
    setEditing(n)
    setPartyName(n.party_name)
    setContent(n.content ?? "")
    setModalOpen(true)
  }

  async function handleSave() {
    if (!partyName.trim()) {
      toast.error("Party name is required")
      return
    }
    setSaving(true)
    try {
      const res = await fetch(
        editing ? `/api/sticky-notes/${editing.id}` : "/api/sticky-notes",
        {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ party_name: partyName, content }),
        },
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Save failed")
      setNotes((prev) =>
        editing ? prev.map((n) => (n.id === data.id ? data : n)) : [data, ...prev],
      )
      setModalOpen(false)
      toast.success(editing ? "Sticky updated" : "Sticky added")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(n: Sticky) {
    const ok = await confirm({
      title: "Delete sticky note?",
      description: "This note will be permanently removed.",
      confirmText: "Delete",
      destructive: true,
    })
    if (!ok) return
    try {
      const res = await fetch(`/api/sticky-notes/${n.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Delete failed")
      setNotes((prev) => prev.filter((x) => x.id !== n.id))
      toast.success("Sticky deleted")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error")
    }
  }

  const cards: TopButton[][] = [
    [
      { label: "JAVAK GHAT", tone: "red", href: "/dashboard/invoice/javak/ghat" },
      { label: "JAVAK WASTAGE", tone: "red", href: "/dashboard/invoice/javak/wastage" },
      { label: "AAVAK", tone: "dark", href: "/dashboard/invoice/aavak/add" },
    ],
    [
      { label: "ADD PAYMENT", tone: "red", href: "/dashboard/payment" },
      { label: "GARANU", tone: "red", href: "/dashboard/invoice/garanu/add" },
      { label: "ADD STICKY", tone: "dark", action: "sticky" },
    ],
    [
      { label: "PARTY TAREEJ", tone: "red", href: "/dashboard/ledger/party-tareej" },
      { label: "RS DAILY ROJMED", tone: "dark", href: "/dashboard/ledger/rs-daily-rojmed" },
      { label: "FINE DAILY ROJMED", tone: "dark", href: "/dashboard/ledger/fine-daily-rojmed" },
    ],
  ]

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* ── top action cards ── */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((btns, i) => (
          <div key={i} className="flex flex-col items-center gap-3 rounded-lg border bg-card p-6">
            {btns.map((b) => (
              <TopBtn key={b.label} btn={b} onSticky={openAdd} />
            ))}
          </div>
        ))}
      </div>

      {/* ── sticky notes ── */}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {notes.map((n) => (
          <div key={n.id} className="relative rounded-lg border bg-card shadow-sm">
            <div className="absolute -top-3 right-2 flex gap-1">
              <Button variant="default" size="icon-sm" onClick={() => openEdit(n)}>
                <PencilIcon className="size-3.5" />
              </Button>
              <Button variant="destructive" size="icon-sm" onClick={() => handleDelete(n)}>
                <XIcon className="size-3.5" />
              </Button>
            </div>
            <div className="rounded-t-lg bg-primary px-3 py-2 text-center text-sm font-semibold uppercase text-primary-foreground">
              {n.party_name}
            </div>
            <div
              className="px-4 py-3 text-sm text-foreground [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
              dangerouslySetInnerHTML={{ __html: n.content ?? "" }}
            />
          </div>
        ))}
      </div>

      {/* ── add / edit modal ── */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="mt-10 w-full max-w-xl rounded-lg bg-card shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-5 py-3">
              <h2 className="text-base font-semibold uppercase">
                {editing ? "Edit" : "Add"} Sticky Notes
              </h2>
              <Button variant="ghost" size="icon-sm" onClick={() => setModalOpen(false)}>
                <XIcon className="size-4" />
              </Button>
            </div>

            <div className="flex flex-col gap-3 p-5">
              <Input
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
                placeholder="Party Name"
              />
              <RichTextEditor
                key={editing ? `edit-${editing.id}` : "new"}
                value={content}
                onChange={setContent}
              />
            </div>

            <div className="flex justify-end gap-2 border-t px-5 py-3">
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Close
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : editing ? "Update" : "Add"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TopBtn({ btn, onSticky }: { btn: TopButton; onSticky: () => void }) {
  const variant = btn.tone === "red" ? "default" : "secondary"
  const cls = "h-9 w-48 justify-center text-sm font-semibold"
  if (btn.action === "sticky") {
    return (
      <Button variant={variant} className={cls} onClick={onSticky}>
        {btn.label}
      </Button>
    )
  }
  return (
    <Button variant={variant} className={cls} render={<Link href={btn.href ?? "#"} />}>
      {btn.label}
    </Button>
  )
}
