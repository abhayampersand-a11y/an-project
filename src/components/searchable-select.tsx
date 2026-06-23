"use client"

import * as React from "react"
import { Combobox } from "@base-ui/react/combobox"
import { ChevronDownIcon, CheckIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type SearchableSelectProps = {
  value: string
  onValueChange: (value: string) => void
  options: string[]
  placeholder?: string
  emptyText?: string
  className?: string
  disabled?: boolean
}

/**
 * A select control with type-to-filter search, styled to match the Select
 * component. Backed by Base UI's Combobox, so the list narrows as you type.
 */
export function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select",
  emptyText = "No results",
  className,
  disabled,
}: SearchableSelectProps) {
  return (
    <Combobox.Root
      items={options}
      value={value || null}
      onValueChange={(v) => onValueChange(v ?? "")}
      disabled={disabled}
    >
      <div className={cn("relative", className)}>
        <Combobox.Input
          placeholder={placeholder}
          className="flex h-8 w-full items-center rounded-lg border border-input bg-transparent py-2 pr-14 pl-2.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
        />
        <div className="absolute inset-y-0 right-1.5 flex items-center gap-0.5">
          {value ? (
            <Combobox.Clear
              aria-label="Clear"
              className="flex size-5 items-center justify-center rounded text-muted-foreground hover:text-foreground"
            >
              <XIcon className="size-4" />
            </Combobox.Clear>
          ) : null}
          <Combobox.Trigger
            aria-label="Open"
            className="flex size-5 items-center justify-center text-muted-foreground"
          >
            <ChevronDownIcon className="size-4" />
          </Combobox.Trigger>
        </div>
      </div>

      <Combobox.Portal>
        <Combobox.Positioner sideOffset={4} className="isolate z-50">
          <Combobox.Popup className="max-h-[min(var(--available-height),18rem)] w-(--anchor-width) origin-(--transform-origin) overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
            <Combobox.Empty className="px-2 py-3 text-center text-sm text-muted-foreground">
              {emptyText}
            </Combobox.Empty>
            <Combobox.List>
              {(item: string) => (
                <Combobox.Item
                  key={item}
                  value={item}
                  className="relative flex w-full cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground"
                >
                  <span className="flex-1">{item}</span>
                  <Combobox.ItemIndicator className="absolute right-2 flex size-4 items-center justify-center">
                    <CheckIcon className="size-4" />
                  </Combobox.ItemIndicator>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  )
}
