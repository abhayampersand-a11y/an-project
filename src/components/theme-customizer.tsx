"use client"

import * as React from "react"
import { toast } from "sonner"
import { CheckIcon, CodeIcon, PaletteIcon, RotateCcwIcon, ShuffleIcon } from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  BASE_COLORS,
  CHART_COLORS,
  DEFAULT_CONFIG,
  MONO_FONTS,
  SANS_FONTS,
  STYLES,
  THEME_COLORS,
  type ThemeConfig,
  buildThemeCss,
  clearThemeConfig,
  hasStoredTheme,
  loadThemeConfig,
  presetId,
  previewThemeConfig,
  randomThemeConfig,
  removeThemeOverride,
  restorePersistedTheme,
  saveThemeConfig,
} from "@/lib/theme-config"

type Swatched = { value: string; label: string; swatch?: string; stack?: string }

/** A labelled select row with an optional swatch and per-option previews. */
function ThemeSelect({
  title,
  swatch,
  value,
  options,
  isFont,
  onChange,
}: {
  title: string
  swatch?: string
  value: string
  options: Swatched[]
  isFont?: boolean
  onChange: (value: string) => void
}) {
  const items = React.useMemo(
    () => options.map((o) => ({ label: o.label, value: o.value })),
    [options],
  )
  return (
    <div className="space-y-2 rounded-lg border bg-card p-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {title}
        </Label>
        {swatch && (
          <span
            className="size-3.5 rounded-full ring-1 ring-border"
            style={{ background: swatch }}
          />
        )}
      </div>
      <Select value={value} onValueChange={(v) => onChange(v as string)} items={items}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.swatch && (
                <span
                  className="size-3.5 rounded-full ring-1 ring-border"
                  style={{ background: o.swatch }}
                />
              )}
              <span style={isFont ? { fontFamily: o.stack } : undefined}>{o.label}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function ThemeCustomizer() {
  const [open, setOpen] = React.useState(false)
  // `draft` is what the panel shows / live-previews; `applied` is the last
  // saved (or built-in) theme we revert to when a preview is discarded.
  const [draft, setDraft] = React.useState<ThemeConfig>(DEFAULT_CONFIG)
  const [applied, setApplied] = React.useState<ThemeConfig>(DEFAULT_CONFIG)
  const [persisted, setPersisted] = React.useState(false)

  React.useEffect(() => {
    const stored = loadThemeConfig()
    setDraft(stored)
    setApplied(stored)
    setPersisted(hasStoredTheme())
  }, [])

  const update = (patch: Partial<ThemeConfig>) => {
    const next = { ...draft, ...patch }
    setDraft(next)
    previewThemeConfig(next) // live preview across the whole app
  }

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) {
      // Re-sync the draft to the applied theme when opening.
      setDraft(applied)
      if (persisted) restorePersistedTheme()
      else removeThemeOverride()
    } else {
      // Discard any unsaved preview on close.
      if (persisted) restorePersistedTheme()
      else removeThemeOverride()
      setDraft(applied)
    }
  }

  const handleApply = () => {
    saveThemeConfig(draft)
    setApplied(draft)
    setPersisted(true)
    toast.success("Theme applied across the app")
  }

  const handleShuffle = () => update(randomThemeConfig())

  const handleReset = () => {
    clearThemeConfig()
    setDraft(DEFAULT_CONFIG)
    setApplied(DEFAULT_CONFIG)
    setPersisted(false)
    toast.success("Reverted to the default theme")
  }

  const handleGetCode = async () => {
    try {
      await navigator.clipboard.writeText(buildThemeCss(draft))
      toast.success("Theme CSS copied to clipboard")
    } catch {
      toast.error("Couldn't copy to clipboard")
    }
  }

  const dirty = JSON.stringify(draft) !== JSON.stringify(applied)

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Customize theme">
            <PaletteIcon className="size-5" />
          </Button>
        }
      />
      <SheetContent className="w-full gap-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle className="flex items-center gap-2">
            <PaletteIcon className="size-4" /> Theme
          </SheetTitle>
          <SheetDescription>
            Preview presets live, then apply them across the dashboard.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          <ThemeSelect
            title="Style"
            value={draft.style}
            options={STYLES}
            onChange={(v) => update({ style: v })}
          />
          <ThemeSelect
            title="Base Color"
            swatch={BASE_COLORS.find((o) => o.value === draft.baseColor)?.swatch}
            value={draft.baseColor}
            options={BASE_COLORS}
            onChange={(v) => update({ baseColor: v })}
          />
          <ThemeSelect
            title="Theme"
            swatch={THEME_COLORS.find((o) => o.value === draft.themeColor)?.swatch}
            value={draft.themeColor}
            options={THEME_COLORS}
            onChange={(v) => update({ themeColor: v })}
          />
          <ThemeSelect
            title="Chart Color"
            swatch={CHART_COLORS.find((o) => o.value === draft.chartColor)?.swatch}
            value={draft.chartColor}
            options={CHART_COLORS}
            onChange={(v) => update({ chartColor: v })}
          />
          <Separator className="my-1" />
          <ThemeSelect
            title="Heading Font"
            value={draft.headingFont}
            options={SANS_FONTS}
            isFont
            onChange={(v) => update({ headingFont: v })}
          />
          <ThemeSelect
            title="Body Font"
            value={draft.bodyFont}
            options={SANS_FONTS}
            isFont
            onChange={(v) => update({ bodyFont: v })}
          />
          <ThemeSelect
            title="Mono Font"
            value={draft.monoFont}
            options={MONO_FONTS}
            isFont
            onChange={(v) => update({ monoFont: v })}
          />
        </div>

        <SheetFooter className="gap-2 border-t">
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-md bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
              --preset {presetId(draft)}
            </code>
            <Button variant="outline" size="sm" onClick={handleShuffle}>
              <ShuffleIcon /> Shuffle
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={handleGetCode}>
              <CodeIcon /> Get Code
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcwIcon /> Reset
            </Button>
          </div>
          <Button onClick={handleApply} disabled={!dirty}>
            <CheckIcon />
            {dirty ? "Apply" : "Applied"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
