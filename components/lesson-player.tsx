// components/lesson-player.tsx

"use client";

import Link from "next/link";
import { useState } from "react";
import type { Lesson } from "@/types/lesson";
import type {
  ConceptStep,
  DecisionStep,
  StoryStep,
  SummaryStep,
} from "@/types/steps";

export function LessonPlayer({ lesson }: { lesson: Lesson }) {
  const [index, setIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  const total = lesson.steps.length;
  const finished = index >= total;
  const step = lesson.steps[index];
  const progress = total === 0 ? 0 : Math.round((index / total) * 100);
  const canContinue = step?.type !== "decision" || selectedOptionId !== null;

  function next() {
    setIndex((i) => i + 1);
    setSelectedOptionId(null);
  }

  function restart() {
    setIndex(0);
    setSelectedOptionId(null);
  }

  if (total === 0) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 px-4 py-20 text-center">
        <p className="font-bold text-slate-500">Ta lekcja nie ma jeszcze kroków.</p>
        <BackLink />
      </div>
    );
  }

  if (finished) {
    // TODO: tutaj wywołaj zapis ukończenia lekcji (Server Action -> CompleteLesson)
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 px-4 py-16 text-center">
        <h1 className="text-3xl font-extrabold text-slate-800">Lekcja ukończona!</h1>
        <p className="text-lg font-medium text-slate-600">{lesson.title}</p>
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={restart}
            className="rounded-2xl border-2 border-b-4 border-slate-300 bg-white px-6 py-3 font-extrabold text-slate-700 active:translate-y-[2px] active:border-b-2"
          >
            Powtórz lekcję
          </button>
          <BackLink />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full w-full flex-col">
      <header className="mx-auto flex w-full max-w-2xl items-center gap-4 px-4 py-4">
        <Link
          href="/topic"
          aria-label="Wyjdź z lekcji"
          className="text-2xl font-bold leading-none text-slate-400 hover:text-slate-600"
        >
          ✕
        </Link>
        <div
          className="h-4 flex-1 overflow-hidden rounded-full bg-slate-200"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Postęp lekcji ${lesson.title}`}
        >
          <div
            className="h-full rounded-full bg-green-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 pb-32 pt-6">
        <h1 className="text-2xl font-extrabold text-slate-800">{step.title}</h1>

        {step.type === "story" && <StoryView step={step} />}
        {step.type === "concept" && <ConceptView step={step} />}
        {step.type === "decision" && (
          <DecisionView
            key={step.id}
            step={step}
            selectedId={selectedOptionId}
            onSelect={setSelectedOptionId}
          />
        )}
        {step.type === "summary" && <SummaryView step={step} />}
      </main>

      <footer className="fixed inset-x-0 bottom-0 border-t-2 border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-2xl justify-end px-4 py-5">
          <button
            type="button"
            disabled={!canContinue}
            onClick={next}
            className="w-full rounded-2xl border-b-4 border-green-700 bg-green-500 px-8 py-3 font-extrabold text-white active:translate-y-[2px] active:border-b-2 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-200 disabled:text-slate-400 sm:w-auto"
          >
            {index + 1 === total ? "Zakończ" : "Dalej"}
          </button>
        </div>
      </footer>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/topic"
      className="rounded-2xl border-b-4 border-green-700 bg-green-500 px-6 py-3 font-extrabold text-white active:translate-y-[2px] active:border-b-2"
    >
      Wróć do lekcji
    </Link>
  );
}

function StoryView({ step }: { step: StoryStep }) {
  return (
    <p className="whitespace-pre-line text-lg font-medium leading-relaxed text-slate-700">
      {step.narrative}
    </p>
  );
}

function ConceptView({ step }: { step: ConceptStep }) {
  return (
    <>
      <p className="whitespace-pre-line text-lg font-medium leading-relaxed text-slate-700">
        {step.explanation}
      </p>
      <div className="rounded-2xl border-2 border-sky-300 bg-sky-100 p-5">
        <p className="font-extrabold text-sky-700">Najważniejsze</p>
        <p className="mt-1 font-medium text-sky-800">{step.keyTakeaway}</p>
      </div>
    </>
  );
}

// Case study bez kar: każdą opcję można wybrać i zobaczyć jej konsekwencje,
// a najlepsza opcja jest zaznaczona dopiero po pierwszym wyborze.
function DecisionView({
  step,
  selectedId,
  onSelect,
}: {
  step: DecisionStep;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const selected = step.options.find((o) => o.id === selectedId) ?? null;

  return (
    <>
      <p className="whitespace-pre-line text-lg font-medium leading-relaxed text-slate-700">
        {step.scenario}
      </p>

      <ul className="flex flex-col gap-3">
        {step.options.map((option) => {
          const isSelected = option.id === selectedId;

          let style = "border-slate-300 bg-white text-slate-800 hover:bg-slate-100";
          if (selected && option.isOptimal)
            style = "border-green-500 bg-green-100 text-green-700";
          else if (isSelected) style = "border-amber-400 bg-amber-100 text-amber-800";

          return (
            <li key={option.id}>
              <button
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelect(option.id)}
                className={`w-full rounded-2xl border-2 border-b-4 px-5 py-4 text-left text-lg font-bold transition-transform duration-75 active:translate-y-[2px] active:border-b-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-300 ${style}`}
              >
                {option.label}
              </button>
            </li>
          );
        })}
      </ul>

      <div aria-live="polite">
        {selected && (
          <div
            className={`rounded-2xl border-2 p-5 ${
              selected.isOptimal
                ? "border-green-300 bg-green-100 text-green-800"
                : "border-amber-300 bg-amber-100 text-amber-900"
            }`}
          >
            <p className="font-extrabold">
              {selected.isOptimal ? "Dobry wybór" : "Zobacz, co to oznacza"}
            </p>
            <p className="mt-1 font-medium">{selected.feedback}</p>
          </div>
        )}
      </div>
    </>
  );
}

function SummaryView({ step }: { step: SummaryStep }) {
  return (
    <>
      <p className="whitespace-pre-line text-lg font-medium leading-relaxed text-slate-700">
        {step.summary}
      </p>
      {step.keyTakeaways.length > 0 && (
        <ul className="flex flex-col gap-3">
          {step.keyTakeaways.map((item) => (
            <li
              key={item}
              className="flex gap-3 rounded-2xl border-2 border-green-300 bg-green-100 p-4 font-bold text-green-800"
            >
              <span aria-hidden="true">✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}