"use client"

import * as React from "react"

export type Theme = "light" | "dark" | "system"
export type ResolvedTheme = "light" | "dark"

type ThemeContextValue = {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: ResolvedTheme
}

const STORAGE_KEY = "theme"

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined)

function systemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function readStored(defaultTheme: Theme): Theme {
  if (typeof window === "undefined") return defaultTheme
  try {
    return (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? defaultTheme
  } catch {
    return defaultTheme
  }
}

function resolve(theme: Theme): ResolvedTheme {
  return theme === "system" ? systemTheme() : theme
}

// Toggles the documentElement class to the resolved theme. When
// `disableTransition` is set, CSS transitions are suppressed for the swap so
// switching themes doesn't animate every color on the page.
function applyTheme(resolved: ResolvedTheme, disableTransition: boolean) {
  const root = document.documentElement
  let restore: (() => void) | undefined

  if (disableTransition) {
    const style = document.createElement("style")
    style.appendChild(
      document.createTextNode("*,*::before,*::after{transition:none!important}"),
    )
    document.head.appendChild(style)
    restore = () => {
      // Force a reflow so the suppression takes effect before removal.
      window.getComputedStyle(document.body)
      setTimeout(() => document.head.removeChild(style), 1)
    }
  }

  root.classList.remove("light", "dark")
  root.classList.add(resolved)
  root.style.colorScheme = resolved
  restore?.()
}

/**
 * Lightweight theme provider. The initial theme class is applied before paint
 * by the inline script in the root layout (so there's no flash), and this
 * provider keeps it in sync for runtime toggling. Renders no theme-dependent
 * markup itself, so it's safe to read from localStorage during the first
 * client render without a hydration mismatch.
 */
export function ThemeProvider({
  children,
  defaultTheme = "light",
}: {
  children: React.ReactNode
  defaultTheme?: Theme
  // Accepted for drop-in compatibility with the previous next-themes usage.
  attribute?: string
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
}) {
  const [theme, setThemeState] = React.useState<Theme>(() => readStored(defaultTheme))
  const [resolvedTheme, setResolvedTheme] = React.useState<ResolvedTheme>(() =>
    typeof window === "undefined" ? "light" : resolve(readStored(defaultTheme)),
  )

  React.useEffect(() => {
    const resolved = resolve(theme)
    setResolvedTheme(resolved)
    applyTheme(resolved, true)

    if (theme !== "system") return
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => {
      const next = systemTheme()
      setResolvedTheme(next)
      applyTheme(next, false)
    }
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [theme])

  const setTheme = React.useCallback((next: Theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Ignore storage failures (private mode, etc.) — state still updates.
    }
    setThemeState(next)
  }, [])

  const value = React.useMemo<ThemeContextValue>(
    () => ({ theme, setTheme, resolvedTheme }),
    [theme, setTheme, resolvedTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext)
  if (!ctx) {
    return { theme: "system", setTheme: () => {}, resolvedTheme: "light" }
  }
  return ctx
}
