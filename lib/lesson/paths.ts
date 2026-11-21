// lib/lesson/paths.ts

export const LESSON_PATHS = [
  { id: "personal-finance", name: "Personal Finance" },
  { id: "stock-investor", name: "Stock Market Investor" },
  { id: "business-finance", name: "Business Finance" },
  { id: "taxes-and-law", name: "Taxes & Law" },
] as const;

export type LessonPathId = (typeof LESSON_PATHS)[number]["id"];

export const DEFAULT_PATH_ID: LessonPathId = "stock-investor";

export function toPathId(value: string): LessonPathId | undefined {
  return LESSON_PATHS.find((p) => p.id === value)?.id;
}

export function resolvePath(id?: string) {
  return (
    LESSON_PATHS.find((p) => p.id === id) ??
    LESSON_PATHS.find((p) => p.id === DEFAULT_PATH_ID)!
  );
}