// Ekrany końcowe odtwarzacza: lekcja bez kroków oraz lekcja ukończona.
"use client";

import { ChunkyButton } from "@/components/shared/chunky-button";
import { BackLink } from "./back-link";

export function LessonEmpty() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 px-4 py-20 text-center">
      <p className="font-bold text-muted-foreground">This lesson has no steps yet.</p>
      <BackLink />
    </div>
  );
}

export function LessonFinished({ title, onRestart }: { title: string; onRestart: () => void }) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 px-4 py-16 text-center">
      <h1 className="text-3xl font-extrabold text-foreground">Lesson completed!</h1>
      <p className="text-lg font-medium text-muted-foreground">{title}</p>
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
        <ChunkyButton tone="outline-primary" size="lg" onClick={onRestart}>
          Repeat lesson
        </ChunkyButton>
        <BackLink />
      </div>
    </div>
  );
}
