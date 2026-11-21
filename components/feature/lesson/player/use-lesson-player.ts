// Stan i logika odtwarzacza lekcji (krok, wybór opcji, zapis ukończenia).
"use client";

import { useState, useTransition } from "react";
import { completeLesson } from "@/lib/lesson/complete_lesson";
import type { Lesson } from "@/types/lesson";

export function useLessonPlayer(lesson: Lesson) {
  const [index, setIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  // krok interaktywny (dopasowywanie, suwaki...) został rozwiązany/sprawdzony
  const [stepDone, setStepDone] = useState(false);
  const [saved, setSaved] = useState(false);
  const [, startTransition] = useTransition();

  const total = lesson.steps.length;
  const step = lesson.steps[index];
  const finished = index >= total;
  const isLast = index + 1 === total;
  const progress = total === 0 ? 0 : Math.round((index / total) * 100);
  // Decyzja wymaga wyboru opcji, kroki interaktywne – ukończenia zadania.
  const interactive = ["matching", "growth", "budget", "risk", "estimate"].includes(step?.type ?? "");
  const canContinue = step?.type === "decision" ? selectedOptionId !== null : !interactive || stepDone;

  function next() {
    setIndex((i) => i + 1);
    setSelectedOptionId(null);
    setStepDone(false);

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
    setStepDone(false);
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
    completeStep: () => setStepDone(true),
    next,
    restart,
  };
}
