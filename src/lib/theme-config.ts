/**
 * Theme customization engine.
 *
 * Selections (style / base color / theme color / chart color / fonts) are
 * turned into a block of CSS that overrides the `:root` and `.dark` custom
 * properties defined in globals.css. Because those variables drive every
 * shadcn component, injecting this block applies the theme across the whole
 * app. The generated CSS and the raw selection are persisted to localStorage
 * so the choice survives reloads, and a pre-paint script in the root layout
 * re-injects it before first paint to avoid a flash of the default theme.
 */

export type FontOption = {
  value: string
  label: string
  /** CSS variable set by the matching next/font loader in the root layout. */
  varName: string
  /** Rough preview stack so the dropdown shows the family before it loads. */
  stack: string
}

export type BaseColorOption = {
  value: string
  label: string
  /** Swatch shown next to the selector. */
  swatch: string
  chroma: number
  hue: number
}

export type ThemeColorOption = {
  value: string
  label: string
  swatch: string
  hue: number
  chroma: number
  lightL: number
  darkL: number
  /** Which foreground reads well on top of the primary color. */
  fg: "light" | "dark"
}

export type ChartColorOption = {
  value: string
  label: string
  swatch: string
  hue: number
}

export type StyleOption = {
  value: string
  label: string
  radius: string
}

export type ThemeConfig = {
  style: string
  baseColor: string
  themeColor: string
  chartColor: string
  headingFont: string
  bodyFont: string
  monoFont: string
}

// ---------------------------------------------------------------------------
// Option registries
// ---------------------------------------------------------------------------

// NOTE: `varName` values here MUST match the next/font loaders declared in
// src/app/layout.tsx. Keep the two lists in sync when adding a font.
export const SANS_FONTS: FontOption[] = [
  { value: "inter", label: "Inter", varName: "--font-inter", stack: "'Inter', sans-serif" },
  { value: "geist", label: "Geist", varName: "--font-geist", stack: "'Geist', sans-serif" },
  { value: "poppins", label: "Poppins", varName: "--font-poppins", stack: "'Poppins', sans-serif" },
  { value: "montserrat", label: "Montserrat", varName: "--font-montserrat", stack: "'Montserrat', sans-serif" },
  { value: "dm-sans", label: "DM Sans", varName: "--font-dm-sans", stack: "'DM Sans', sans-serif" },
  { value: "space-grotesk", label: "Space Grotesk", varName: "--font-space-grotesk", stack: "'Space Grotesk', sans-serif" },
  { value: "playfair", label: "Playfair Display", varName: "--font-playfair", stack: "'Playfair Display', serif" },
  { value: "source-serif", label: "Source Serif", varName: "--font-source-serif", stack: "'Source Serif 4', serif" },
]

export const MONO_FONTS: FontOption[] = [
  { value: "geist-mono", label: "Geist Mono", varName: "--font-geist-mono", stack: "'Geist Mono', monospace" },
  { value: "jetbrains-mono", label: "JetBrains Mono", varName: "--font-jetbrains-mono", stack: "'JetBrains Mono', monospace" },
  { value: "roboto-mono", label: "Roboto Mono", varName: "--font-roboto-mono", stack: "'Roboto Mono', monospace" },
]

export const BASE_COLORS: BaseColorOption[] = [
  { value: "neutral", label: "Neutral", swatch: "oklch(0.556 0 0)", chroma: 0, hue: 0 },
  { value: "gray", label: "Gray", swatch: "oklch(0.551 0.006 264)", chroma: 0.006, hue: 264 },
  { value: "slate", label: "Slate", swatch: "oklch(0.554 0.013 257)", chroma: 0.013, hue: 257 },
  { value: "zinc", label: "Zinc", swatch: "oklch(0.552 0.007 286)", chroma: 0.007, hue: 286 },
  { value: "stone", label: "Stone", swatch: "oklch(0.553 0.006 60)", chroma: 0.006, hue: 60 },
]

export const THEME_COLORS: ThemeColorOption[] = [
  { value: "violet", label: "Violet", swatch: "oklch(0.55 0.2 292)", hue: 292, chroma: 0.2, lightL: 0.55, darkL: 0.66, fg: "light" },
  { value: "indigo", label: "Indigo", swatch: "oklch(0.51 0.19 272)", hue: 272, chroma: 0.19, lightL: 0.51, darkL: 0.62, fg: "light" },
  { value: "blue", label: "Blue", swatch: "oklch(0.55 0.19 262)", hue: 262, chroma: 0.19, lightL: 0.55, darkL: 0.62, fg: "light" },
  { value: "teal", label: "Teal", swatch: "oklch(0.6 0.12 185)", hue: 185, chroma: 0.12, lightL: 0.6, darkL: 0.7, fg: "light" },
  { value: "green", label: "Green", swatch: "oklch(0.58 0.15 150)", hue: 150, chroma: 0.15, lightL: 0.58, darkL: 0.68, fg: "light" },
  { value: "amber", label: "Amber", swatch: "oklch(0.72 0.16 75)", hue: 75, chroma: 0.16, lightL: 0.72, darkL: 0.77, fg: "dark" },
  { value: "orange", label: "Orange", swatch: "oklch(0.65 0.18 55)", hue: 55, chroma: 0.18, lightL: 0.65, darkL: 0.7, fg: "dark" },
  { value: "rose", label: "Rose", swatch: "oklch(0.58 0.19 12)", hue: 12, chroma: 0.19, lightL: 0.58, darkL: 0.65, fg: "light" },
  { value: "red", label: "Red", swatch: "oklch(0.58 0.22 27)", hue: 27, chroma: 0.22, lightL: 0.58, darkL: 0.65, fg: "light" },
]

export const CHART_COLORS: ChartColorOption[] = [
  { value: "violet", label: "Violet", swatch: "oklch(0.62 0.16 292)", hue: 292 },
  { value: "blue", label: "Blue", swatch: "oklch(0.62 0.16 262)", hue: 262 },
  { value: "teal", label: "Teal", swatch: "oklch(0.62 0.16 185)", hue: 185 },
  { value: "green", label: "Green", swatch: "oklch(0.62 0.16 150)", hue: 150 },
  { value: "amber", label: "Amber", swatch: "oklch(0.72 0.15 75)", hue: 75 },
  { value: "rose", label: "Rose", swatch: "oklch(0.62 0.16 12)", hue: 12 },
]

export const STYLES: StyleOption[] = [
  { value: "sharp", label: "Sharp", radius: "0rem" },
  { value: "default", label: "Default", radius: "0.625rem" },
  { value: "rounded", label: "Rounded", radius: "1rem" },
]

export const DEFAULT_CONFIG: ThemeConfig = {
  style: "default",
  baseColor: "slate",
  themeColor: "violet",
  chartColor: "violet",
  headingFont: "inter",
  bodyFont: "inter",
  monoFont: "geist-mono",
}

export const STORAGE_KEY = "om-theme-config"
export const CSS_STORAGE_KEY = "om-theme-css"
export const STYLE_ELEMENT_ID = "om-theme-overrides"

// ---------------------------------------------------------------------------
// CSS generation
// ---------------------------------------------------------------------------

function oklch(l: number, c: number, h: number): string {
  return `oklch(${round(l)} ${round(c)} ${h})`
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000
}

function find<T extends { value: string }>(list: T[], value: string, fallback: T): T {
  return list.find((o) => o.value === value) ?? fallback
}

/** Neutral ramp tinted by the base color's hue/chroma. */
function baseColorVars(base: BaseColorOption, mode: "light" | "dark"): Record<string, string> {
  const { chroma: c, hue: h } = base
  if (mode === "light") {
    return {
      "--background": "oklch(1 0 0)",
      "--foreground": oklch(0.21, c, h),
      "--card": "oklch(1 0 0)",
      "--card-foreground": oklch(0.21, c, h),
      "--popover": "oklch(1 0 0)",
      "--popover-foreground": oklch(0.21, c, h),
      "--secondary": oklch(0.968, c, h),
      "--secondary-foreground": oklch(0.21, c, h),
      "--muted": oklch(0.968, c, h),
      "--muted-foreground": oklch(0.552, c, h),
      "--border": oklch(0.922, c, h),
      "--input": oklch(0.922, c, h),
      "--sidebar": oklch(0.985, c, h),
      "--sidebar-foreground": oklch(0.21, c, h),
      "--sidebar-border": oklch(0.922, c, h),
    }
  }
  return {
    "--background": oklch(0.155, c, h),
    "--foreground": oklch(0.985, c, h),
    "--card": oklch(0.215, c, h),
    "--card-foreground": oklch(0.985, c, h),
    "--popover": oklch(0.215, c, h),
    "--popover-foreground": oklch(0.985, c, h),
    "--secondary": oklch(0.27, c, h),
    "--secondary-foreground": oklch(0.985, c, h),
    "--muted": oklch(0.27, c, h),
    "--muted-foreground": oklch(0.708, c, h),
    "--border": "oklch(1 0 0 / 10%)",
    "--input": "oklch(1 0 0 / 15%)",
    "--sidebar": oklch(0.215, c, h),
    "--sidebar-foreground": oklch(0.985, c, h),
    "--sidebar-border": "oklch(1 0 0 / 10%)",
  }
}

/** Primary / accent / ring driven by the chosen theme color. */
function themeColorVars(theme: ThemeColorOption, mode: "light" | "dark"): Record<string, string> {
  const { hue: h, chroma: c } = theme
  const primary = mode === "light" ? oklch(theme.lightL, c, h) : oklch(theme.darkL, c, h)
  const primaryFg = theme.fg === "light" ? "oklch(0.985 0 0)" : "oklch(0.21 0 0)"
  if (mode === "light") {
    return {
      "--primary": primary,
      "--primary-foreground": primaryFg,
      "--accent": oklch(0.95, c * 0.35, h),
      "--accent-foreground": oklch(0.4, c, h),
      "--ring": primary,
      "--sidebar-primary": primary,
      "--sidebar-primary-foreground": primaryFg,
      "--sidebar-accent": oklch(0.95, c * 0.35, h),
      "--sidebar-accent-foreground": oklch(0.4, c, h),
      "--sidebar-ring": primary,
    }
  }
  return {
    "--primary": primary,
    "--primary-foreground": primaryFg,
    "--accent": oklch(0.31, c * 0.5, h),
    "--accent-foreground": "oklch(0.985 0 0)",
    "--ring": primary,
    "--sidebar-primary": primary,
    "--sidebar-primary-foreground": primaryFg,
    "--sidebar-accent": oklch(0.31, c * 0.5, h),
    "--sidebar-accent-foreground": "oklch(0.985 0 0)",
    "--sidebar-ring": primary,
  }
}

/** Five chart hues fanned out from the chosen starting hue. */
function chartVars(chart: ChartColorOption, mode: "light" | "dark"): Record<string, string> {
  const l = mode === "light" ? 0.62 : 0.7
  const c = 0.16
  const vars: Record<string, string> = {}
  for (let i = 0; i < 5; i++) {
    vars[`--chart-${i + 1}`] = oklch(l, c, (chart.hue + i * 34) % 360)
  }
  return vars
}

function block(selector: string, vars: Record<string, string>): string {
  const body = Object.entries(vars)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join("\n")
  return `${selector} {\n${body}\n}`
}

/** Build the full override stylesheet for a config. */
export function buildThemeCss(config: ThemeConfig): string {
  const base = find(BASE_COLORS, config.baseColor, BASE_COLORS[0])
  const theme = find(THEME_COLORS, config.themeColor, THEME_COLORS[0])
  const chart = find(CHART_COLORS, config.chartColor, CHART_COLORS[0])
  const style = find(STYLES, config.style, STYLES[1])
  const heading = find(SANS_FONTS, config.headingFont, SANS_FONTS[0])
  const body = find(SANS_FONTS, config.bodyFont, SANS_FONTS[0])
  const mono = find(MONO_FONTS, config.monoFont, MONO_FONTS[0])

  const rootVars: Record<string, string> = {
    ...baseColorVars(base, "light"),
    ...themeColorVars(theme, "light"),
    ...chartVars(chart, "light"),
    "--radius": style.radius,
    "--font-sans": `var(${body.varName})`,
    "--font-heading": `var(${heading.varName})`,
    "--font-mono": `var(${mono.varName})`,
  }

  const darkVars: Record<string, string> = {
    ...baseColorVars(base, "dark"),
    ...themeColorVars(theme, "dark"),
    ...chartVars(chart, "dark"),
  }

  return `${block(":root", rootVars)}\n\n${block(".dark", darkVars)}\n`
}

// ---------------------------------------------------------------------------
// Persistence & DOM application
// ---------------------------------------------------------------------------

export function loadThemeConfig(): ThemeConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_CONFIG
    return { ...DEFAULT_CONFIG, ...(JSON.parse(raw) as Partial<ThemeConfig>) }
  } catch {
    return DEFAULT_CONFIG
  }
}

/** Inject (or update) the override <style> element in <head>. */
export function applyThemeCss(css: string): void {
  if (typeof document === "undefined") return
  let el = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null
  if (!el) {
    el = document.createElement("style")
    el.id = STYLE_ELEMENT_ID
  }
  el.textContent = css
  // Append last so it wins over globals.css in source order.
  document.head.appendChild(el)
}

/** Live-preview a config without persisting it. */
export function previewThemeConfig(config: ThemeConfig): void {
  applyThemeCss(buildThemeCss(config))
}

/** Persist a config and apply it across the app. */
export function saveThemeConfig(config: ThemeConfig): void {
  const css = buildThemeCss(config)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    localStorage.setItem(CSS_STORAGE_KEY, css)
  } catch {
    // Ignore storage failures (private mode, quota) — CSS is still applied.
  }
  applyThemeCss(css)
}

/** Whether a customized theme has been saved. */
export function hasStoredTheme(): boolean {
  if (typeof window === "undefined") return false
  try {
    return localStorage.getItem(STORAGE_KEY) != null
  } catch {
    return false
  }
}

/** Remove the override <style> so the app falls back to globals.css defaults. */
export function removeThemeOverride(): void {
  if (typeof document === "undefined") return
  document.getElementById(STYLE_ELEMENT_ID)?.remove()
}

/** Forget any saved customization and revert to the built-in theme. */
export function clearThemeConfig(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(CSS_STORAGE_KEY)
  } catch {
    // ignore
  }
  removeThemeOverride()
}

/** Re-apply the last persisted CSS (used to discard an unsaved preview). */
export function restorePersistedTheme(): void {
  if (typeof window === "undefined") return
  try {
    const css = localStorage.getItem(CSS_STORAGE_KEY)
    applyThemeCss(css ?? buildThemeCss(DEFAULT_CONFIG))
  } catch {
    applyThemeCss(buildThemeCss(DEFAULT_CONFIG))
  }
}

/** A short, human-readable preset id derived from the selections. */
export function presetId(config: ThemeConfig): string {
  const seed = Object.values(config).join("|")
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0
  }
  return Math.abs(hash).toString(36).slice(0, 10)
}

/** Random config for the Shuffle button. */
export function randomThemeConfig(): ThemeConfig {
  const pick = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)]
  return {
    style: pick(STYLES).value,
    baseColor: pick(BASE_COLORS).value,
    themeColor: pick(THEME_COLORS).value,
    chartColor: pick(CHART_COLORS).value,
    headingFont: pick(SANS_FONTS).value,
    bodyFont: pick(SANS_FONTS).value,
    monoFont: pick(MONO_FONTS).value,
  }
}
