// Stan i logika odtwarzacza lekcji (krok, wybór opcji, zapis ukończenia).
"use client";

import { useState, useTransition } from "react";
import { completeLesson } from "@/lib/lesson/complete_lesson";
import type { Lesson } from "@/types/lesson";

export function useLessonPlayer(lesson: Lesson) {
  const [index, setIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [, startTransition] = useTransition();

  const total = lesson.steps.length;
  const step = lesson.steps[index];
  const finished = index >= total;
  const isLast = index + 1 === total;
  const progress = total === 0 ? 0 : Math.round((index / total) * 100);
  // Krok z decyzją wymaga wyboru opcji przed przejściem dalej.
  const canContinue = step?.type !== "decision" || selectedOptionId !== null;

  function next() {
    setIndex((i) => i + 1);
    setSelectedOptionId(null);

    // Zapis ukończenia lekcji (progress + streak) przy kliknięciu "Finish".
    if (isLast && !saved) {
      startTransition(async () => {
        await completeLesson(lesson.id);
        setSaved(true);
      });
    }
  }

  function restart() {
    setIndex(0);
    setSelectedOptionId(null);
  }

  return {
    index,
    total,
    step,
    finished,
    isLast,
    progress,
    canContinue,
    selectedOptionId,
    setSelectedOptionId,
    next,
    restart,
  };
}
