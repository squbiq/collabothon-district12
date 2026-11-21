// components/shared/chunky-card.tsx
//
// Uniwersalna karta "3D" (gruby dolny border, wciska się po kliknięciu).
// Bez `href` renderuje <div>, z `href` – <Link>. Kolory zgodne z ChunkyButton.
import Link from "next/link"
import type * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const chunkyCardVariants = cva(
  "block w-full rounded-2xl border-2 border-b-[6px] p-5 outline-none transition-[transform,filter] duration-75 focus-visible:ring-4",
  {
    variants: {
      tone: {
        primary: "border-sky-700 bg-sky-500 text-white focus-visible:ring-sky-300",
        success: "border-green-700 bg-green-500 text-white focus-visible:ring-green-300",
        danger: "border-red-700 bg-red-500 text-white focus-visible:ring-red-300",
        neutral: "border-border bg-muted text-muted-foreground focus-visible:ring-ring/40",
      },
      // Karta klikalna: reaguje na hover i wciska się po kliknięciu.
      interactive: {
        true: "hover:brightness-105 active:translate-y-[4px] active:border-b-2",
        false: "",
      },
      disabled: {
        true: "cursor-not-allowed",
        false: "",
      },
    },
    defaultVariants: { tone: "primary", interactive: false, disabled: false },
  }
)

type ChunkyCardProps = Omit<React.ComponentProps<"div">, "children"> &
  Pick<VariantProps<typeof chunkyCardVariants>, "tone"> & {
    children: React.ReactNode
    /** Gdy podany, karta jest linkiem. */
    href?: string
    /** Wyłącza interakcję (brak linku, brak efektu wciskania). */
    disabled?: boolean
  }

function ChunkyCard({
  className,
  tone,
  href,
  disabled = false,
  children,
  ...props
}: ChunkyCardProps) {
  const isLink = !!href && !disabled
  const classes = cn(
    chunkyCardVariants({ tone, interactive: isLink, disabled }),
    className
  )

  if (isLink) {
    return (
      <Link data-slot="chunky-card" href={href} className={classes}>
        {children}
      </Link>
    )
  }

  return (
    <div
      data-slot="chunky-card"
      aria-disabled={disabled || undefined}
      className={classes}
      {...props}
    >
      {children}
    </div>
  )
}

export { ChunkyCard, chunkyCardVariants }
