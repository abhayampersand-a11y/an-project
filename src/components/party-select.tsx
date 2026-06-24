"use client"

import * as React from "react"

import { SearchableSelect } from "@/components/searchable-select"

type PartyApiRow = { party_name: string; party_type: string }

type PartySelectProps = {
  value: string
  onValueChange: (name: string) => void
  /** When true, only parties whose type is "Vepari" are listed. */
  onlyVepari?: boolean
  placeholder?: string
  emptyText?: string
  className?: string
  disabled?: boolean
}

/**
 * Party picker backed by /api/parties. Every option shows the party type in
 * parentheses, e.g. "Ramesh (Vepari)", while the value passed to/from the
 * parent stays the plain party name (what the database stores).
 */
export function PartySelect({
  value,
  onValueChange,
  onlyVepari = false,
  placeholder = "Select party",
  emptyText = "No parties",
  className,
  disabled,
}: PartySelectProps) {
  const [parties, setParties] = React.useState<{ name: string; type: string }[]>([])

  React.useEffect(() => {
    fetch("/api/parties")
      .then((r) => r.json())
      .then((d: PartyApiRow[]) => {
        if (!Array.isArray(d)) return
        const list = d
          .filter((p) => !onlyVepari || String(p.party_type).toLowerCase() === "vepari")
          .map((p) => ({ name: p.party_name, type: p.party_type }))
        setParties(list)
      })
      .catch(() => {})
  }, [onlyVepari])

  const options = React.useMemo(() => parties.map((p) => `${p.name} (${p.type})`), [parties])
  const labelToName = React.useMemo(
    () => new Map(parties.map((p) => [`${p.name} (${p.type})`, p.name])),
    [parties],
  )
  const nameToLabel = React.useMemo(
    () => new Map(parties.map((p) => [p.name, `${p.name} (${p.type})`])),
    [parties],
  )

  return (
    <SearchableSelect
      value={nameToLabel.get(value) ?? value}
      onValueChange={(v) => onValueChange(labelToName.get(v) ?? v)}
      options={options}
      placeholder={placeholder}
      emptyText={emptyText}
      className={className}
      disabled={disabled}
    />
  )
}
