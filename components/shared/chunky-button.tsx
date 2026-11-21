// Przycisk "3D" (gruby dolny border, wciska się po kliknięciu) w stylu kart z /lesson-map.
// Użycie jako przycisk:  <ChunkyButton tone="success">Dalej</ChunkyButton>
// Użycie jako link:      <Link className={chunkyButtonVariants({ tone: "primary" })} href="/x">…</Link>
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const chunkyButtonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border-2 border-b-[6px] font-extrabold whitespace-nowrap uppercase tracking-wide transition-[transform,filter] duration-75 outline-none select-none hover:brightness-105 active:translate-y-[4px] active:border-b-2 focus-visible:ring-4 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      tone: {
        primary: "border-sky-700 bg-sky-500 text-white focus-visible:ring-sky-300",
        success: "border-green-700 bg-green-500 text-white focus-visible:ring-green-300",
        danger: "border-red-700 bg-red-500 text-white focus-visible:ring-red-300",
        neutral:
          "border-border bg-muted text-muted-foreground focus-visible:ring-ring/40",
        "outline-none":
          "border-border bg-background text-foreground hover:bg-muted focus-visible:ring-ring/40",
        "outline-primary":
          "border-lime-700 bg-background text-foreground hover:bg-muted focus-visible:ring-ring/40",
        "outline-danger":
          "border-red-700 bg-background text-foreground hover:bg-muted focus-visible:ring-ring/40",
      },
      size: {
        sm: "h-9 px-3 text-xs",
        default: "h-11 px-5 text-sm",
        lg: "h-14 px-6 text-base",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      tone: "primary",
      size: "default",
      fullWidth: false,
    },
  }
)

function ChunkyButton({
  className,
  tone,
  size,
  fullWidth,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof chunkyButtonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="chunky-button"
      className={cn(chunkyButtonVariants({ tone, size, fullWidth }), className)}
      {...props}
    />
  )
}

export { ChunkyButton, chunkyButtonVariants }
