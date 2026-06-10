"use client"

import * as React from "react"
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  ListIcon,
  ListOrderedIcon,
  StrikethroughIcon,
} from "lucide-react"

/**
 * Minimal rich-text editor built on contentEditable + execCommand. Stores HTML.
 * `value` is only read on mount, so remount (via key) when switching records.
 */
export function RichTextEditor({
  value,
  onChange,
}: {
  value: string
  onChange: (html: string) => void
}) {
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (ref.current) ref.current.innerHTML = value || ""
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const exec = (cmd: string, arg?: string) => {
    document.execCommand(cmd, false, arg)
    ref.current?.focus()
    onChange(ref.current?.innerHTML ?? "")
  }

  return (
    <div className="rounded-md border">
      <div className="flex flex-wrap items-center gap-1 border-b bg-muted/40 p-1.5">
        <ToolBtn onClick={() => exec("bold")} title="Bold"><BoldIcon className="size-4" /></ToolBtn>
        <ToolBtn onClick={() => exec("italic")} title="Italic"><ItalicIcon className="size-4" /></ToolBtn>
        <ToolBtn onClick={() => exec("underline")} title="Underline"><UnderlineIcon className="size-4" /></ToolBtn>
        <ToolBtn onClick={() => exec("strikeThrough")} title="Strikethrough"><StrikethroughIcon className="size-4" /></ToolBtn>
        <span className="mx-1 h-5 w-px bg-border" />
        <ToolBtn onClick={() => exec("insertUnorderedList")} title="Bullet list"><ListIcon className="size-4" /></ToolBtn>
        <ToolBtn onClick={() => exec("insertOrderedList")} title="Numbered list"><ListOrderedIcon className="size-4" /></ToolBtn>
        <span className="mx-1 h-5 w-px bg-border" />
        <input
          type="color"
          title="Text color"
          className="size-7 cursor-pointer rounded border bg-transparent p-0.5"
          onChange={(e) => exec("foreColor", e.target.value)}
        />
        <select
          title="Font size"
          defaultValue=""
          onChange={(e) => { if (e.target.value) exec("fontSize", e.target.value) }}
          className="h-7 rounded border bg-transparent px-1 text-xs outline-none"
        >
          <option value="" disabled>Size</option>
          <option value="2">Small</option>
          <option value="3">Normal</option>
          <option value="5">Large</option>
          <option value="6">Huge</option>
        </select>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={() => onChange(ref.current?.innerHTML ?? "")}
        className="min-h-40 w-full overflow-auto px-3 py-2 text-sm outline-none [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
      />
    </div>
  )
}

function ToolBtn({
  onClick,
  title,
  children,
}: {
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      // Use onMouseDown to keep the editor selection while clicking the button.
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      className="flex size-7 items-center justify-center rounded hover:bg-muted"
    >
      {children}
    </button>
  )
}
