// lib/lesson/paths.ts
//
// Domyślne tematy (ścieżki nauki) – źródło danych dla seeda (scripts/seed.ts).
// Aplikacja czyta tematy z tabeli Topic (patrz lib/lesson/topics.ts), a id tematu
// jest tym samym, co parametr ?path= na mapie lekcji.
export const LESSON_PATHS = [
  { id: "personal-finance", name: "Personal Finance" },
  { id: "stock-investor", name: "Stock Market Investor" },
  { id: "business-finance", name: "Business Finance" },
  { id: "taxes-and-law", name: "Taxes & Law" },
] as const;
