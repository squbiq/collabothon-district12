// lib/lesson/mappers.ts
//
// Wspólne mapowanie wiersza Prisma na typy domenowe.
// Używane przez getLesson (lesson.ts) i getLessons (lessons.ts),
// żeby lista pól lekcji była zdefiniowana w jednym miejscu.

import type { LessonBase } from "@/types/lesson";
import type { PersonaType } from "@/types/users";
import { toPathId } from "./paths";

interface LessonRow {
  id: string;
  order: number;
  pathId: string;
  chapterId: string;
  chapter: { orderNumber: number; chapterTitle: string };
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
    pathId: toPathId(row.pathId),
    chapterId: row.chapterId,
    chapterNumber: row.chapter.orderNumber,
    chapterTitle: row.chapter.chapterTitle,
    title: row.title,
    description: row.description,
    estimatedMinutes: row.estimatedMinutes,
    unlockAssetId: row.unlockAssetId,
    targetPersonas: row.targetPersonas.map((p) => p.persona),
  };
}