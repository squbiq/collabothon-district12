// lib/lesson/lesson.ts

import { prisma } from "@/lib/prisma";
import type { Lesson } from "@/types/lesson";
import type { LessonStep } from "@/types/steps";
import { toLessonBase } from "./mappers";
import { rowToLessonStep } from "./step-data";

// ---- Pobieranie z bazy ----

export async function getLesson(id: string): Promise<Lesson | null> {
    const row = await prisma.lesson.findUnique({
    where: { id },
    include: {
      chapter: true,
      targetPersonas: true,
      steps: { orderBy: { order: "asc" } },
    },
  });

  if (!row) return null;

  // Krok z brakującymi lub niepoprawnymi danymi jest pomijany (z ostrzeżeniem w konsoli).
  const steps = row.steps.flatMap((s): LessonStep[] => {
    const step = rowToLessonStep(s);
    if (step) return [step];
    console.warn(`Skipped invalid step ${s.id} (${s.type}) in lesson ${id}`);
    return [];
  });

  return { ...toLessonBase(row), steps };
}