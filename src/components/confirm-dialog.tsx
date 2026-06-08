"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type ConfirmOptions = {
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  /** Style the confirm button as a destructive (red) action. */
  destructive?: boolean
}

type ConfirmFn = (options?: ConfirmOptions) => Promise<boolean>

const ConfirmContext = React.createContext<ConfirmFn | null>(null)

/**
 * Provides an imperative `confirm()` dialog. Wrap the app once, then call
 * `const confirm = useConfirm()` anywhere and `if (await confirm({...}))`.
 */
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const [options, setOptions] = React.useState<ConfirmOptions>({})
  const resolverRef = React.useRef<((value: boolean) => void) | null>(null)

  const confirm = React.useCallback<ConfirmFn>((opts = {}) => {
    setOptions(opts)
    setOpen(true)
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve
    })
  }, [])

  function settle(result: boolean) {
    setOpen(false)
    resolverRef.current?.(result)
    resolverRef.current = null
  }

  const {
    title = "Are you sure?",
    description = "This action cannot be undone.",
    confirmText = "Confirm",
    cancelText = "Cancel",
    destructive = false,
  } = options

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog
        open={open}
        onOpenChange={(next: boolean) => {
          // Closing via Esc / backdrop counts as cancel.
          if (!next) settle(false)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => settle(false)}>
              {cancelText}
            </Button>
            <Button
              variant={destructive ? "destructive" : "default"}
              onClick={() => settle(true)}
            >
              {confirmText}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  )
}

export function useConfirm(): ConfirmFn {
  const ctx = React.useContext(ConfirmContext)
  if (!ctx) {
    throw new Error("useConfirm must be used within a <ConfirmProvider>")
  }
  return ctx
}
