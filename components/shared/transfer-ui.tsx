// components/shared/transfer-ui.tsx
//
// Wspólne elementy dialogów importu/eksportu JSON w panelu admina (lekcje i zadania dzienne).
"use client";

import type { ReactNode } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

// Musi mieścić się w serverActions.bodySizeLimit z next.config.ts (5 MB).
export const MAX_FILE_BYTES = 4_500_000;

export function downloadJson(filename: string, json: string) {
  const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function TransferOption({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <Label className="flex cursor-pointer items-start gap-2 font-medium">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(v === true)} className="mt-0.5" />
      <span className="flex flex-col">
        {label}
        {hint && <span className="text-xs font-normal text-muted-foreground">{hint}</span>}
      </span>
    </Label>
  );
}

export function TransferError({ children }: { children: ReactNode }) {
  return children ? (
    <p role="alert" className="text-sm font-medium text-destructive">
      {children}
    </p>
  ) : null;
}
