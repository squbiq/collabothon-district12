// components/shared/chubby-tooltip.tsx
//
// Tooltip w stylu "chubby" (jak ChunkyButton): gruby dolny border, zaokrąglone rogi, pogrubiony napis.
// Użycie:
//   <ChubbyTooltip label="Profile" side="right" disabled={!collapsed}>
//     <Link href="/profile" className={...}>…</Link>
//   </ChubbyTooltip>
// Dzieci muszą być jednym elementem przyjmującym ref i propsy (Link, button).
// Provider (opóźnienie, natychmiastowe kolejne dymki) jest w app/providers.tsx.
"use client"

import type { ReactElement } from "react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export const chubbyTooltipClass =
  "rounded-2xl border-2 border-b-4 border-border bg-popover px-3.5 py-2 text-sm font-extrabold tracking-wide text-popover-foreground uppercase shadow-sm " +
  // krótka animacja (125 ms, ease-out), bez animacji dla kolejnych dymków w grupie
  "duration-150 ease-out data-instant:duration-0 motion-reduce:animate-none"

type Props = {
  label: React.ReactNode
  children: ReactElement
  side?: "top" | "right" | "bottom" | "left"
  /** Wyłączony tooltip renderuje same dzieci (np. gdy menu jest rozwinięte i etykieta już widoczna). */
  disabled?: boolean
  className?: string
}

export function ChubbyTooltip({ label, children, side = "right", disabled, className }: Props) {
  if (disabled) return children

  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent side={side} sideOffset={10} arrow={false} className={cn(chubbyTooltipClass, className)}>
        {label}
      </TooltipContent>
    </Tooltip>
  )
}
