// lib/lesson/mappers.ts
//
// Wspólne mapowanie wiersza Prisma na typy domenowe.
// Używane przez getLesson (lesson.ts) i getLessons (lessons.ts),
// żeby lista pól lekcji była zdefiniowana w jednym miejscu.

import type { LessonBase } from "@/types/lesson";
import type { PersonaType } from "@/types/users";

// Pola mogą być null (np. niepełne dane w bazie lub opcjonalna relacja),
// dlatego każde z nich ma bezpieczną wartość domyślną w toLessonBase.
interface LessonRow {
  id: string;
  order: number | null;
  chapterId: string | null;
  chapter: { orderNumber: number | null; chapterTitle: string | null; topicId: string | null } | null;
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
    topicId: row.chapter?.topicId ?? "",
    chapterId: row.chapterId ?? "",
    chapterNumber: row.chapter?.orderNumber ?? 0,
    chapterTitle: row.chapter?.chapterTitle ?? "",
    title: row.title ?? "Untitled lesson",
    description: row.description ?? "",
    estimatedMinutes: row.estimatedMinutes ?? 0,
    unlockAssetId: row.unlockAssetId ?? null,
    targetPersonas: (row.targetPersonas ?? []).map((p) => p.persona),
  };
}
