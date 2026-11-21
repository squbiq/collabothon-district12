// components/shared/use-currency.ts
//
// Wybrana waluta kalkulatorów, zapamiętana w przeglądarce (localStorage). Wspólna dla wszystkich kalkulatorów,
// więc zmiana w jednym miejscu zmienia wszystkie. Bez providera i bez efektów – useSyncExternalStore.
"use client";

import { useCallback, useSyncExternalStore } from "react";
import { DEFAULT_CURRENCY, formatMoney, isCurrencyCode, localizeAmounts, type CurrencyCode } from "@/lib/currency";

const KEY = "finanz.currency";
const EVENT = "finanz:currency";

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function read(): CurrencyCode {
  try {
    const stored = localStorage.getItem(KEY);
    return isCurrencyCode(stored) ? stored : DEFAULT_CURRENCY;
  } catch {
    return DEFAULT_CURRENCY;
  }
}

export function useCurrency(): [CurrencyCode, (code: CurrencyCode) => void] {
  const currency = useSyncExternalStore(subscribe, read, () => DEFAULT_CURRENCY);
  const setCurrency = useCallback((code: CurrencyCode) => {
    try {
      localStorage.setItem(KEY, code);
    } catch {
      // tryb prywatny – waluta zostaje tylko do odświeżenia strony
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);
  return [currency, setCurrency];
}

/** Formatowanie kwoty (podanej w EUR) i tekstu z kwotami w wybranej walucie. */
export function useMoney() {
  const [currency] = useCurrency();
  const money = useCallback((eur: number) => formatMoney(eur, currency), [currency]);
  const localize = useCallback((text: string) => localizeAmounts(text, currency), [currency]);
  return { money, localize, currency };
}
