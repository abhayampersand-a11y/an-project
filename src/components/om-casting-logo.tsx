import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Om Casting brand logo: a faceted emerald gem emblem (a nod to casting /
 * jewellery work) plus the wordmark. Use `showWordmark={false}` for the
 * compact mark only.
 */
export function OmCastingLogo({
  className,
  showWordmark = true,
  wordmarkClassName,
}: {
  className?: string
  showWordmark?: boolean
  wordmarkClassName?: string
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <GemBadge className="size-11 shrink-0" />
      {showWordmark && (
        <span
          className={cn(
            "font-black leading-none tracking-wide whitespace-nowrap",
            wordmarkClassName,
          )}
        >
          <span>OM</span>
          <span className="ml-1 font-semibold opacity-90">CASTING</span>
        </span>
      )}
    </span>
  )
}

function GemBadge({ className }: { className?: string }) {
  const gid = React.useId()
  return (
    <svg viewBox="0 0 44 44" className={className} role="img" aria-label="Om Casting">
      <defs>
        <linearGradient id={`bg-${gid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="55%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#4338ca" />
        </linearGradient>
      </defs>

      {/* badge */}
      <rect x="0" y="0" width="44" height="44" rx="11" fill={`url(#bg-${gid})`} />
      <rect x="0.5" y="0.5" width="43" height="43" rx="10.5" fill="none" stroke="#ffffff" strokeOpacity="0.18" />

      {/* faceted gem */}
      <g stroke="#3730a3" strokeOpacity="0.18" strokeWidth="0.6" strokeLinejoin="round">
        {/* table (top flat facet) */}
        <path d="M15 15 L29 15 L26 21 L18 21 Z" fill="#ffffff" />
        {/* left crown */}
        <path d="M15 15 L10 21 L18 21 Z" fill="#ffffff" fillOpacity="0.82" />
        {/* right crown */}
        <path d="M29 15 L34 21 L26 21 Z" fill="#ffffff" fillOpacity="0.82" />
        {/* left pavilion */}
        <path d="M10 21 L18 21 L22 35 Z" fill="#ffffff" fillOpacity="0.62" />
        {/* center pavilion */}
        <path d="M18 21 L26 21 L22 35 Z" fill="#ffffff" fillOpacity="0.95" />
        {/* right pavilion */}
        <path d="M26 21 L34 21 L22 35 Z" fill="#ffffff" fillOpacity="0.7" />
      </g>

      {/* sparkle */}
      <circle cx="33" cy="12" r="1.5" fill="#ffffff" fillOpacity="0.9" />
    </svg>
  )
}
