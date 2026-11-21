// components/feature/arena/arena-duel.tsx
"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Bot, Check, Trophy, User, X } from "lucide-react";
import { ChunkyButton } from "@/components/shared/chunky-button";
import { answerQuestion, startDuel } from "@/lib/arena/actions";
import { ARENA_ROUNDS, XP_REWARDS } from "@/lib/arena/config";
import { cn } from "@/lib/utils";
import type { ArenaQuestion, DuelOutcome } from "@/types/arena";

type Phase = "idle" | "playing" | "finished";
type Reveal = { selectedId: string; correct: boolean; correctOptionId: string; feedback: string };
type Summary = { outcome: DuelOutcome; xp: number; userScore: number; botScore: number };

const OUTCOME_TITLES: Record<DuelOutcome, string> = {
  win: "You won!",
  draw: "It's a draw",
  loss: "The bot won this time",
};

// Wygląd kółek z punktami – zmieniasz tutaj.
const DOT_BASE =
  "flex size-9 items-center justify-center rounded-full border-2 border-b-4 transition-all duration-300 sm:size-11";
const DOT_STYLES = {
  pending: "border-muted-foreground/30 bg-muted/40",
  correct: "border-green-700 bg-green-500 text-white",
  wrong: "border-red-700 bg-red-500 text-white shadow-lg shadow-red-500/40",
};

function Dot({ result, active }: { result: boolean | undefined; active: boolean }) {
  const state = result === undefined ? "pending" : result ? "correct" : "wrong";
  const label = state === "pending" ? "Not answered yet" : state === "correct" ? "Correct" : "Wrong";
  return (
    <span
      role="img"
      aria-label={label}
      className={cn(DOT_BASE, DOT_STYLES[state], active && "ring-4 ring-primary/30")}
    >
      {state === "correct" && <Check className="size-5" strokeWidth={4} />}
      {state === "wrong" && <X className="size-5" strokeWidth={4} />}
    </span>
  );
}

function ScoreColumn({
  label,
  icon,
  results,
  total,
  activeIndex,
}: {
  label: string;
  icon: ReactNode;
  results: boolean[];
  total: number;
  activeIndex: number;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex flex-col items-center gap-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <ol className="flex flex-col gap-3">
        {Array.from({ length: total }, (_, i) => (
          <li key={i}>
            <Dot result={results[i]} active={i === activeIndex} />
          </li>
        ))}
      </ol>
    </div>
  );
}

export function ArenaDuel() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [duelId, setDuelId] = useState("");
  const [questions, setQuestions] = useState<ArenaQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [userResults, setUserResults] = useState<boolean[]>([]);
  const [botResults, setBotResults] = useState<boolean[]>([]);
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);

  function start() {
    setError(null);
    startTransition(async () => {
      const result = await startDuel();
      if (!result.ok) return setError(result.error);
      setDuelId(result.duelId);
      setQuestions(result.questions);
      setIndex(0);
      setUserResults([]);
      setBotResults([]);
      setReveal(null);
      setSummary(null);
      setPhase("playing");
    });
  }

  function choose(optionId: string) {
    if (reveal || pending) return;
    const question = questions[index];
    setError(null);
    startTransition(async () => {
      const result = await answerQuestion(duelId, question.id, optionId);
      if (!result.ok) return setError(result.error);

      setReveal({
        selectedId: optionId,
        correct: result.correct,
        correctOptionId: result.correctOptionId,
        feedback: result.feedback,
      });
      setUserResults((prev) => [...prev, result.correct]);
      setBotResults((prev) => [...prev, result.botCorrect]);

      if (result.finished && result.outcome) {
        setSummary({
          outcome: result.outcome,
          xp: result.xp ?? 0,
          userScore: result.userScore,
          botScore: result.botScore,
        });
        router.refresh(); // XP jest już zapisane, odśwież dane na stronie
      }
    });
  }

  function next() {
    if (summary) return setPhase("finished");
    setIndex((i) => i + 1);
    setReveal(null);
  }

  if (phase === "idle") {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-5 rounded-2xl border-2 border-b-4 bg-card p-8 text-center">
        <Trophy className="size-12 text-amber-500" />
        <h2 className="text-2xl font-extrabold">Challenge the bot</h2>
        <p className="text-muted-foreground">
          Answer {ARENA_ROUNDS} real-world market scenarios. Whoever gets more right wins.
        </p>
        <div className="flex flex-wrap justify-center gap-2 text-sm font-bold">
          <span className="rounded-xl bg-muted px-3 py-1">Win +{XP_REWARDS.win} XP</span>
          <span className="rounded-xl bg-muted px-3 py-1">Draw +{XP_REWARDS.draw} XP</span>
          <span className="rounded-xl bg-muted px-3 py-1">Loss +{XP_REWARDS.loss} XP</span>
        </div>
        {error && (
          <p role="alert" className="text-sm font-medium text-red-500">
            {error}
          </p>
        )}
        <ChunkyButton type="button" tone="success" size="lg" disabled={pending} onClick={start}>
          {pending ? "Looking for an opponent…" : "Challenge the bot"}
        </ChunkyButton>
      </div>
    );
  }

  const total = questions.length;
  const question = questions[index];
  const activeIndex = reveal || phase === "finished" ? -1 : index;
  const lastBotCorrect = botResults[botResults.length - 1];

  return (
    <div className="mx-auto grid w-full max-w-4xl grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 sm:gap-6">
      <ScoreColumn
        label="You"
        icon={<User className="size-5" />}
        results={userResults}
        total={total}
        activeIndex={activeIndex}
      />

      {phase === "finished" && summary ? (
        <div className="flex flex-col items-center gap-5 rounded-2xl border-2 border-b-4 bg-card p-8 text-center">
          <Trophy className="size-12 text-amber-500" />
          <h2 className="text-2xl font-extrabold">{OUTCOME_TITLES[summary.outcome]}</h2>
          <p className="text-5xl font-extrabold">
            {summary.userScore} : {summary.botScore}
          </p>
          <p className="rounded-xl bg-muted px-4 py-2 font-bold">+{summary.xp} XP</p>
          {error && (
            <p role="alert" className="text-sm font-medium text-red-500">
              {error}
            </p>
          )}
          <ChunkyButton type="button" tone="success" size="lg" disabled={pending} onClick={start}>
            {pending ? "Looking for an opponent…" : "Play again"}
          </ChunkyButton>
        </div>
      ) : (
        <div className="flex flex-col gap-4 rounded-2xl border-2 border-b-4 bg-card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <span className="rounded-xl bg-muted px-3 py-1 text-sm font-bold">{question.category}</span>
            <span className="text-sm font-bold text-muted-foreground">
              Question {index + 1} / {total}
            </span>
          </div>

          <h2 className="text-xl font-extrabold">{question.title}</h2>
          <p className="leading-relaxed text-foreground/90">{question.scenario}</p>

          <ul className="flex flex-col gap-3">
            {question.options.map((option) => {
              const isSelected = reveal?.selectedId === option.id;
              const isBest = reveal?.correctOptionId === option.id;

              let style = "border-border bg-background hover:bg-accent/50";
              if (reveal) {
                if (isBest) style = "border-green-500 bg-green-500/10 text-green-700 dark:text-green-300";
                else if (isSelected) style = "border-red-500 bg-red-500/10 text-red-700 dark:text-red-300";
                else style = "border-border bg-background opacity-60";
              }

              return (
                <li key={option.id}>
                  <button
                    type="button"
                    disabled={Boolean(reveal) || pending}
                    onClick={() => choose(option.id)}
                    className={cn(
                      "w-full rounded-2xl border-2 border-b-4 px-5 py-4 text-left text-base font-bold transition-transform duration-75 active:translate-y-[2px] active:border-b-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-300 disabled:cursor-default",
                      style
                    )}
                  >
                    {option.label}
                  </button>
                </li>
              );
            })}
          </ul>

          <div aria-live="polite">
            {reveal && (
              <div
                className={cn(
                  "rounded-2xl border-2 p-4",
                  reveal.correct
                    ? "border-green-500/50 bg-green-500/10"
                    : "border-amber-500/50 bg-amber-500/10"
                )}
              >
                <p className="font-extrabold">{reveal.correct ? "Correct!" : "Not quite"}</p>
                <p className="mt-1 text-sm font-medium">{reveal.feedback}</p>
                <p className="mt-2 text-sm font-bold text-muted-foreground">
                  The bot answered {lastBotCorrect ? "correctly" : "incorrectly"}.
                </p>
              </div>
            )}
          </div>

          {error && (
            <p role="alert" className="text-sm font-medium text-red-500">
              {error}
            </p>
          )}

          {reveal && (
            <div className="flex justify-end">
              <ChunkyButton type="button" tone="success" size="lg" onClick={next}>
                {summary ? "See result" : "Next question"}
              </ChunkyButton>
            </div>
          )}
        </div>
      )}

      <ScoreColumn
        label="Bot"
        icon={<Bot className="size-5" />}
        results={botResults}
        total={total}
        activeIndex={activeIndex}
      />
    </div>
  );
}