// types/lesson-input.ts

import type { PersonaType } from "./users";

// Wartości muszą zgadzać się z enumem PersonaType w bazie i typem w types/users.ts
export const PERSONAS: PersonaType[] = ["starter", "family"];

export interface DecisionOptionInput {
  label: string;
  isOptimal: boolean;
  feedback: string;
}

// Dane kroku wysyłane z formularza do serwera
export type StepInput =
  | { type: "story"; title: string; narrative: string }
  | { type: "concept"; title: string; explanation: string; keyTakeaway: string }
  | { type: "decision"; title: string; scenario: string; options: DecisionOptionInput[] }
  | { type: "summary"; title: string; summary: string; keyTakeaways: string[] };

export interface CreateLessonInput {
  order: number | null; // null = dodaj na końcu
  chapterId: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  unlockAssetId: string | null;
  targetPersonas: PersonaType[];
  steps: StepInput[];
}

export type CreateLessonResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export type ChapterOption = {
  id: string;
  title: string;
};

export type LessonSummary = {
  id: string;
  title: string;
  order: number | null;
};

// Pełne dane lekcji zwracane przy edycji
export type LessonDetails = CreateLessonInput & {
  id: string;
};

// Dane samej lekcji (bez kroków) – używane w panelu admina do tworzenia i edycji.
export type LessonDataInput = Omit<CreateLessonInput, "steps">;

// Krok razem z identyfikatorem (edycja pojedynczego stage'a).
export type StageDetails = StepInput & { id: string };
