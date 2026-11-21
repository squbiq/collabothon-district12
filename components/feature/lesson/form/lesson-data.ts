// Pola formularza danych lekcji (jako stringi, żeby input mógł być pusty w trakcie edycji).
import type { LessonDataInput } from "@/types/lesson-input";
import type { PersonaType } from "@/types/users";

export type LessonDataFields = {
  /** Tylko do UI: temat wybranego rozdziału (nie jest wysyłany – wynika z rozdziału). */
  topicId: string;
  order: string;
  chapterId: string;
  title: string;
  description: string;
  estimatedMinutes: string;
  unlockAssetId: string;
  personas: PersonaType[];
};

export const emptyLessonData = (): LessonDataFields => ({
  topicId: "",
  order: "",
  chapterId: "",
  title: "",
  description: "",
  estimatedMinutes: "",
  unlockAssetId: "",
  personas: [],
});

export const fromLessonData = (l: LessonDataInput, topicId: string): LessonDataFields => ({
  topicId,
  order: l.order !== null ? String(l.order) : "",
  chapterId: l.chapterId,
  title: l.title,
  description: l.description,
  estimatedMinutes: String(l.estimatedMinutes),
  unlockAssetId: l.unlockAssetId ?? "",
  personas: l.targetPersonas,
});

export const toLessonDataInput = (f: LessonDataFields): LessonDataInput => ({
  order: f.order.trim() === "" ? null : Number(f.order),
  chapterId: f.chapterId,
  title: f.title,
  description: f.description,
  estimatedMinutes: Number(f.estimatedMinutes),
  unlockAssetId: f.unlockAssetId.trim() === "" ? null : f.unlockAssetId,
  targetPersonas: f.personas,
});
