// Odtwarzacz lekcji: pasek postępu, bieżący krok i przycisk dalej.
"use client";

import { ChunkyButton } from "@/components/shared/chunky-button";
import type { Lesson } from "@/types/lesson";
import { LessonEmpty, LessonFinished } from "./lesson-finished";
import { LessonProgressBar } from "./lesson-progress-bar";
import { StepView } from "./steps/step-view";
import { useLessonPlayer } from "./use-lesson-player";

export function LessonPlayer({ lesson }: { lesson: Lesson }) {
  const player = useLessonPlayer(lesson);

  if (player.total === 0) return <LessonEmpty />;
  if (player.finished) return <LessonFinished title={lesson.title} onRestart={player.restart} />;

  return (
    <div className="flex min-h-full w-full flex-col">
      <LessonProgressBar progress={player.progress} title={lesson.title} />

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 pt-6 pb-32">
        <h1 className="text-2xl font-extrabold text-foreground">{player.step.title}</h1>
        <StepView
          step={player.step}
          selectedOptionId={player.selectedOptionId}
          onSelectOption={player.setSelectedOptionId}
          onComplete={player.completeStep}
        />
      </main>

      <footer className="inset-x-0 bottom-0 border-t-2">
        <div className="mx-auto flex w-full max-w-2xl justify-end px-4 py-5">
          <ChunkyButton tone="success" size="lg" disabled={!player.canContinue} onClick={player.next}>
            {player.isLast ? "Finish" : "Next"}
          </ChunkyButton>
        </div>
      </footer>
    </div>
  );
}
