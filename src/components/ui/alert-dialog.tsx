"use client"

import * as React from "react"
import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog"

import { cn } from "@/lib/utils"

function AlertDialog(props: React.ComponentProps<typeof AlertDialogPrimitive.Root>) {
  return <AlertDialogPrimitive.Root {...props} />
}

function AlertDialogTrigger(
  props: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>,
) {
  return <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
}

function AlertDialogClose(
  props: React.ComponentProps<typeof AlertDialogPrimitive.Close>,
) {
  return <AlertDialogPrimitive.Close data-slot="alert-dialog-close" {...props} />
}

function AlertDialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Popup>) {
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Backdrop
        data-slot="alert-dialog-backdrop"
        className="fixed inset-0 z-50 bg-black/50 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
      />
      <AlertDialogPrimitive.Popup
        data-slot="alert-dialog-content"
        className={cn(
          "fixed left-1/2 top-1/2 z-50 grid w-full max-w-md -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl border bg-popover p-6 text-popover-foreground shadow-lg outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className,
        )}
        {...props}
      >
        {children}
      </AlertDialogPrimitive.Popup>
    </AlertDialogPrimitive.Portal>
  )
}

function AlertDialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  )
}

function AlertDialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  )
}

function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn("text-lg font-semibold", className)}
      {...props}
    />
  )
}

function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
}
