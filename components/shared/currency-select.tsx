// components/shared/currency-select.tsx
//
// Przełącznik waluty dla kalkulatorów (domyślnie EUR).
"use client";

import { CURRENCIES, CURRENCY_CODES, isCurrencyCode } from "@/lib/currency";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useCurrency } from "./use-currency";

export function CurrencySelect({ className }: { className?: string }) {
  const [currency, setCurrency] = useCurrency();
  return (
    <Select
      items={CURRENCY_CODES.map((code) => ({ value: code, label: code }))}
      value={currency}
      onValueChange={(value) => isCurrencyCode(value) && setCurrency(value)}
    >
      <SelectTrigger aria-label="Currency" className={cn("w-28 font-bold", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CURRENCY_CODES.map((code) => (
          <SelectItem key={code} value={code}>
            {code} · {CURRENCIES[code].label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
