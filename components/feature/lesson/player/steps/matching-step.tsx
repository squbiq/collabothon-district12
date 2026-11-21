// Łączenie par: definicja (lewa kolumna) z nazwą (prawa kolumna). Poprawna para blokuje się na zielono,
// błędna mignie na czerwono i wraca do gry – bez kar.
"use client";

import { useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { MatchingStep as MatchingStepData } from "@/types/steps";
import { StepText } from "./step-text";

// Stałe tasowanie zależne od id kroku – ten sam układ po odświeżeniu i bez różnic serwer/klient.
function seeded<T>(items: T[], seed: string): T[] {
  let h = 1779033703;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 3432918353);
  const rand = () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const cardClass =
  "w-full rounded-2xl border-2 border-b-4 px-4 py-3 text-left font-bold transition-[transform,background-color,border-color] duration-150 ease-out outline-none focus-visible:ring-4 focus-visible:ring-ring/40 active:scale-[0.98] disabled:active:scale-100";

export function MatchingStep({ step, onComplete }: { step: MatchingStepData; onComplete: () => void }) {
  const left = useMemo(() => seeded(step.pairs, `${step.id}:l`), [step]);
  const right = useMemo(() => seeded(step.pairs, `${step.id}:r`), [step]);
  const [selected, setSelected] = useState<string | null>(null);
  const [matched, setMatched] = useState<ReadonlySet<string>>(new Set());
  const [wrong, setWrong] = useState<{ left: string; right: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function pickRight(id: string) {
    if (!selected || matched.has(id)) return;
    if (selected === id) {
      const next = new Set(matched).add(id);
      setMatched(next);
      setSelected(null);
      if (next.size === step.pairs.length) onComplete();
      return;
    }
    setWrong({ left: selected, right: id });
    setSelected(null);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setWrong(null), 700);
  }

  const complete = matched.size === step.pairs.length;

  return (
    <>
      <StepText>Tap a definition, then the term it describes.</StepText>
      <div className="grid grid-cols-2 gap-3">
        <ul className="flex flex-col gap-3">
          {left.map((pair) => {
            const isMatched = matched.has(pair.id);
            const isWrong = wrong?.left === pair.id;
            return (
              <li key={pair.id}>
                <button
                  type="button"
                  disabled={isMatched}
                  aria-pressed={selected === pair.id}
                  onClick={() => setSelected(pair.id)}
                  className={cn(
                    cardClass,
                    "text-sm",
                    isMatched
                      ? "border-green-500 bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                      : isWrong
                        ? "border-red-400 bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                        : selected === pair.id
                          ? "border-sky-500 bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200"
                          : "border-border bg-card text-card-foreground hover:bg-muted"
                  )}
                >
                  {pair.definition}
                </button>
              </li>
            );
          })}
        </ul>
        <ul className="flex flex-col gap-3">
          {right.map((pair) => {
            const isMatched = matched.has(pair.id);
            const isWrong = wrong?.right === pair.id;
            return (
              <li key={pair.id}>
                <button
                  type="button"
                  disabled={isMatched || !selected}
                  onClick={() => pickRight(pair.id)}
                  className={cn(
                    cardClass,
                    isMatched
                      ? "border-green-500 bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                      : isWrong
                        ? "border-red-400 bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                        : "border-border bg-card text-card-foreground enabled:hover:bg-muted"
                  )}
                >
                  {pair.term}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <div aria-live="polite" className="min-h-6 font-extrabold text-green-700 dark:text-green-300">
        {complete ? "All matched!" : `${matched.size} / ${step.pairs.length} matched`}
      </div>
    </>
  );
}
