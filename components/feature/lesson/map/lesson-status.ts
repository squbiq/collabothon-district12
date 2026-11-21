// Wygląd karty lekcji w zależności od statusu użytkownika.
import type { LessonStatus } from "@/types/lesson";

export type LessonStatusMeta = {
  tone: "success" | "primary" | "neutral";
  label: string;
  /** Klasa koloru tekstu pomocniczego (opis, czas, kroki). */
  muted: string;
  /** Klasy plakietki ze statusem. */
  badge: string;
};

export const LESSON_STATUS_META: Record<LessonStatus, LessonStatusMeta> = {
  completed: { tone: "success", label: "Completed", muted: "text-white/90", badge: "bg-white/20 text-white" },
  active: { tone: "primary", label: "Start", muted: "text-white/90", badge: "bg-white/20 text-white" },
  locked: { tone: "neutral", label: "Locked", muted: "text-muted-foreground", badge: "bg-background/60 text-muted-foreground" },
};
