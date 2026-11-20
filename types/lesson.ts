// types/lesson.ts
//
// Modele domenowe lekcji używane przez UI (strony, LessonPlayer).
// To NIE są typy Prisma: lib/lesson/* mapuje wiersze z bazy na te typy.

import type { PersonaType } from "./users";
import type { LessonStep } from "./steps";
import type { LessonPathId } from "@/lib/lesson/paths";

/** Status lekcji dla danego użytkownika na mapie lekcji. */
export type LessonStatus = "locked" | "active" | "completed";

/** Pola wspólne dla pełnej lekcji i pozycji na mapie lekcji. */
export interface LessonBase {
  id: string;
  order: number;
  pathId?: LessonPathId;
  chapterId: string;
  chapterNumber: number;
  title: string;
  description: string;
  estimatedMinutes: number;
  unlockAssetId: string | null;
  targetPersonas: PersonaType[];
}

/** Pełna lekcja z krokami - dane dla LessonPlayer (getLesson). */
export interface Lesson extends LessonBase {
  steps: LessonStep[];
}

/**
 * Pozycja na mapie lekcji (getLessons): lekcja bez kroków,
 * ale ze statusem użytkownika i liczbą kroków.
 */
export interface LessonMapItem extends LessonBase {
  status: LessonStatus;
  stepsCount: number;
}

/** Wynik ukończenia lekcji (jeszcze nieużywany - patrz TODO w LessonPlayer). */
export interface CompleteLesson {
  lessonId: string;
  earnedCurrency: number;
  newWalletBalance: number;
  unlockedAssetId: string | null;
  alreadyCompleted: boolean;
}