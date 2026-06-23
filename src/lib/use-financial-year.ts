"use client"

import * as React from "react"

export type ActiveFinancialYear = {
  id: number
  label: string
  start_date: string
  end_date: string
}

/**
 * Date-range state for ledger/report pages that defaults to the active
 * financial year configured under Backup → Financial Year.
 *
 * Falls back to the supplied dates when no active year is set. The active
 * year is applied once, on load, so it never clobbers edits the user has
 * already made to the inputs.
 */
/**
 * Returns the active financial year (or null while loading / when none is set).
 * Use this to scope dated list tables to the active cycle.
 */
export function useActiveFinancialYear() {
  const [year, setYear] = React.useState<ActiveFinancialYear | null>(null)

  React.useEffect(() => {
    let cancelled = false
    fetch("/api/financial-years/active")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: ActiveFinancialYear | null) => {
        if (!cancelled && d?.start_date) setYear(d)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  return year
}

/**
 * Keeps only the records whose `dateKey` falls within the active financial
 * year. Dates must be `YYYY-MM-DD` strings (lexicographic compare is safe).
 * Returns every record unchanged when no active year is set.
 */
export function filterByFinancialYear<T>(
  records: T[],
  dateKey: keyof T,
  year: ActiveFinancialYear | null,
): T[] {
  if (!year) return records
  return records.filter((r) => {
    const d = r[dateKey] as unknown as string
    return typeof d === "string" && d >= year.start_date && d <= year.end_date
  })
}

export function useFinancialYearRange(fallbackFrom: string, fallbackTo: string) {
  const [from, setFrom] = React.useState(fallbackFrom)
  const [to, setTo] = React.useState(fallbackTo)

  React.useEffect(() => {
    let cancelled = false
    fetch("/api/financial-years/active")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: ActiveFinancialYear | null) => {
        if (cancelled || !d?.start_date) return
        setFrom(d.start_date)
        setTo(d.end_date)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  return { from, setFrom, to, setTo }
}
