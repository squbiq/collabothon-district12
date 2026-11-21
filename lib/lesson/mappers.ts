// lib/lesson/mappers.ts
//
// Wspólne mapowanie wiersza Prisma na typy domenowe.
// Używane przez getLesson (lesson.ts) i getLessons (lessons.ts),
// żeby lista pól lekcji była zdefiniowana w jednym miejscu.

import type { LessonBase } from "@/types/lesson";
import type { PersonaType } from "@/types/users";
import { toPathId } from "./paths";

// Pola mogą być null (np. niepełne dane w bazie lub opcjonalna relacja),
// dlatego każde z nich ma bezpieczną wartość domyślną w toLessonBase.
interface LessonRow {
  id: string;
  order: number | null;
  pathId: string | null;
  chapterId: string | null;
  chapter: { orderNumber: number | null; chapterTitle: string | null } | null;
  title: string | null;
  description: string | null;
  estimatedMinutes: number | null;
  unlockAssetId: string | null;
  targetPersonas: { persona: PersonaType }[] | null;
}

export function toLessonBase(row: LessonRow): LessonBase {
  return {
    id: row.id,
    order: row.order ?? 0,
    // Brak (lub nieznany) pathId -> undefined: lekcja pokazuje się w każdej ścieżce.
    pathId: row.pathId ? toPathId(row.pathId) : undefined,
    chapterId: row.chapterId ?? "",
    chapterNumber: row.chapter?.orderNumber ?? 0,
    title: row.title ?? "Untitled lesson",
    description: row.description ?? "",
    estimatedMinutes: row.estimatedMinutes ?? 0,
    unlockAssetId: row.unlockAssetId ?? null,
    targetPersonas: (row.targetPersonas ?? []).map((p) => p.persona),
  };
}
