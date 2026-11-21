// Etykieta + opcjonalna podpowiedź nad polem formularza.
import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "cn";

type Props = {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
};

export function FormField({ label, hint, htmlFor, children, className }: Props) {
  return (
    <div className={cn(className, "flex flex-col gap-1.5")}>
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={htmlFor} className="font-semibold">
          {label}
        </Label>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
