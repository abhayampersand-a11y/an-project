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
 * Party picker backed by /api/parties. Lists plain party names; pass
 * `onlyVepari` to restrict the list to parties whose type is "Vepari".
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
  const [options, setOptions] = React.useState<string[]>([])

  React.useEffect(() => {
    fetch("/api/parties")
      .then((r) => r.json())
      .then((d: PartyApiRow[]) => {
        if (!Array.isArray(d)) return
        setOptions(
          d
            .filter((p) => !onlyVepari || String(p.party_type).toLowerCase() === "vepari")
            .map((p) => p.party_name),
        )
      })
      .catch(() => {})
  }, [onlyVepari])

  return (
    <SearchableSelect
      value={value}
      onValueChange={onValueChange}
      options={options}
      placeholder={placeholder}
      emptyText={emptyText}
      className={className}
      disabled={disabled}
    />
  )
}
