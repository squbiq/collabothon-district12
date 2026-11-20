// lib/lesson/mappers.ts
//
// Wspólne mapowanie wiersza Prisma na typy domenowe.
// Używane przez getLesson (lesson.ts) i getLessons (lessons.ts),
// żeby lista pól lekcji była zdefiniowana w jednym miejscu.

import type { LessonBase } from "@/types/lesson";
import type { PersonaType } from "@/types/users";

// Minimalny kształt wiersza lekcji z relacją targetPersonas (include: { targetPersonas: true }).
interface LessonRow {
  id: string;
  order: number;
  chapterTitle: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  unlockAssetId: string | null;
  targetPersonas: { persona: PersonaType }[];
}

export function toLessonBase(row: LessonRow): LessonBase {
  return {
    id: row.id,
    order: row.order,
    chapterTitle: row.chapterTitle,
    title: row.title,
    description: row.description,
    estimatedMinutes: row.estimatedMinutes,
    unlockAssetId: row.unlockAssetId,
    targetPersonas: row.targetPersonas.map((p) => p.persona),
  };
}
