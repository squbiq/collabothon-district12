// types/lesson-transfer.ts
//
// Format pliku JSON do eksportu/importu lekcji (panel admina).
import type { StepInput } from "./lesson-input";
import type { PersonaType } from "./users";

export const LESSON_EXPORT_FORMAT = "lesson-export";
export const LESSON_EXPORT_VERSION = 1;

export type LessonExportLesson = {
  /** Pomijane w eksporcie "bez ID". */
  id?: string;
  order: number;
  title: string;
  description: string;
  estimatedMinutes: number;
  experience: number;
  unlockAssetId?: string | null;
  targetPersonas: PersonaType[];
  topic: { id?: string; title: string };
  chapter: { id?: string; title: string };
  steps: StepInput[];
};

export type LessonExportFile = {
  format: typeof LESSON_EXPORT_FORMAT;
  version: typeof LESSON_EXPORT_VERSION;
  lessons: LessonExportLesson[];
};
