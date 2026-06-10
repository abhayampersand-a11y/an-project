"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"

const num = (v: unknown) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

/**
 * Editable balance field that never shows a minus sign. The number box holds the
 * magnitude; the sign is kept internally and surfaced as an automatic cr/dr tag
 * (positive → cr, negative → dr). Typing a new magnitude keeps the current sign.
 * `value`/`onChange` work on the signed numeric string (e.g. "-8399").
 */
export function BalanceInput({
  value,
  onChange,
}: {
  value: string
  onChange: (next: string) => void
}) {
  const n = num(value)
  const isCr = n >= 0
  const mag = Math.abs(n)

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        value={mag === 0 ? "" : String(mag)}
        onChange={(e) => {
          const m = Math.abs(num(e.target.value))
          onChange(String(isCr ? m : -m))
        }}
      />
      <span className="w-6 text-sm font-medium text-muted-foreground">
        {isCr ? "cr" : "dr"}
      </span>
    </div>
  )
}
