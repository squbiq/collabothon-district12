// lib/currency.ts
//
// Waluty kalkulatorów. Wszystkie kwoty w kodzie i w konfiguracji lekcji są liczone w EUR (waluta bazowa);
// przy wyświetlaniu przeliczamy je po stałych, poglądowych kursach – to nie jest narzędzie do wymiany walut.
// Plik bez "use client", więc korzystają z niego zarówno serwer, jak i klient.

export const DEFAULT_CURRENCY = "EUR" as const;

export const CURRENCIES = {
  EUR: { label: "Euro", rate: 1 },
  PLN: { label: "Polish zloty", rate: 4.25 },
  USD: { label: "US dollar", rate: 1.08 },
  GBP: { label: "British pound", rate: 0.85 },
  CHF: { label: "Swiss franc", rate: 0.95 },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;
export const CURRENCY_CODES = Object.keys(CURRENCIES) as CurrencyCode[];

export const isCurrencyCode = (value: unknown): value is CurrencyCode =>
  typeof value === "string" && value in CURRENCIES;

/** Kwota z EUR na wybraną walutę. */
export const convertFromEur = (eur: number, code: CurrencyCode): number => eur * CURRENCIES[code].rate;

/** Np. 1234.5 EUR → "€1,235" albo "PLN 5,247" (bez groszy – to kalkulatory poglądowe). */
export function formatMoney(eur: number, code: CurrencyCode = DEFAULT_CURRENCY): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: code, maximumFractionDigits: 0 }).format(
    convertFromEur(eur, code)
  );
}

// "1,000,000 zł", "500 EUR", "€6,000" – kwoty w treści zadań zapisane przez admina.
const AMOUNT_IN_TEXT = /(?:€\s?)?(\d[\d,]*(?:\.\d+)?)\s?(?:zł|PLN|EUR|€)|€\s?(\d[\d,]*(?:\.\d+)?)/g;

/**
 * Podmienia kwoty w tekście zadania na wybraną walutę. Liczby traktujemy jak EUR (tak jak w konfiguracji kroku),
 * a oznaczenie waluty zapisane przez admina ("zł", "€") jest tylko ozdobą.
 */
export function localizeAmounts(text: string, code: CurrencyCode = DEFAULT_CURRENCY): string {
  return text.replace(AMOUNT_IN_TEXT, (_match, a: string | undefined, b: string | undefined) => {
    const value = Number((a ?? b ?? "").replaceAll(",", ""));
    return Number.isFinite(value) ? formatMoney(value, code) : _match;
  });
}

/** Czy `unit` z konfiguracji kroku oznacza pieniądze (wtedy wartość jest przeliczana na wybraną walutę). */
export const isMoneyUnit = (unit: string | undefined): boolean =>
  !!unit && ["zł", "pln", "eur", "€"].includes(unit.trim().toLowerCase());
