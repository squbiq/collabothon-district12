// components/feature/arena/arena-duel.tsx
//
// Walka z botem: wybór trudności, pytania z puli zadań dziennych, wynik i XP.
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bot, Trophy, User } from "lucide-react";
import { ChunkyButton } from "@/components/shared/chunky-button";
import { answerQuestion, startDuel } from "@/lib/arena/actions";
import { BOT_DIFFICULTIES, BOT_DIFFICULTY_KEYS, XP_REWARDS, type BotDifficulty } from "@/lib/arena/config";
import { cn } from "@/lib/utils";
import type { ArenaQuestion, DuelOutcome } from "@/types/arena";
import { ArenaCard, ErrorLine, OptionButton, ScoreColumn, type OptionState } from "./arena-parts";

type Phase = "idle" | "playing" | "finished";
type Reveal = { selectedId: string; correct: boolean; correctOptionId: string; feedback: string };
type Summary = { outcome: DuelOutcome; xp: number; userScore: number; botScore: number };

const OUTCOME_TITLES: Record<DuelOutcome, string> = {
  win: "You won!",
  draw: "It's a draw",
  loss: "The bot won this time",
};

export function ArenaDuel({ rounds, onExit }: { rounds: number; onExit: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [phase, setPhase] = useState<Phase>("idle");
  const [difficulty, setDifficulty] = useState<BotDifficulty>("medium");
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
      const result = await startDuel(difficulty);
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
    const level = BOT_DIFFICULTIES[difficulty];
    return (
      <ArenaCard className="mx-auto flex w-full max-w-xl flex-col items-center gap-5 p-8 text-center">
        <Trophy className="size-12 text-amber-500" />
        <h2 className="text-2xl font-extrabold">Challenge the bot</h2>
        <p className="text-muted-foreground">
          Answer {rounds} real-world market {rounds === 1 ? "scenario" : "scenarios"}. Whoever gets more right wins.
        </p>

        <div role="radiogroup" aria-label="Bot difficulty" className="flex w-full flex-wrap justify-center gap-2">
          {BOT_DIFFICULTY_KEYS.map((key) => (
            <ChunkyButton
              key={key}
              type="button"
              role="radio"
              aria-checked={difficulty === key}
              tone={difficulty === key ? "primary" : "outline-none"}
              className="min-w-24 flex-1"
              onClick={() => setDifficulty(key)}
            >
              {BOT_DIFFICULTIES[key].label}
            </ChunkyButton>
          ))}
        </div>
        <p className="text-sm font-medium text-muted-foreground">{level.description}</p>

        <div className="flex flex-wrap justify-center gap-2 text-sm font-bold">
          {(["win", "draw", "loss"] as const).map((key) => (
            <span key={key} className="rounded-xl bg-muted px-3 py-1 capitalize">
              {key} +{Math.round(XP_REWARDS[key] * level.xpMultiplier)} XP
            </span>
          ))}
        </div>

        <ErrorLine message={error} />
        <div className="flex flex-wrap justify-center gap-3">
          <ChunkyButton type="button" tone="outline-none" size="lg" onClick={onExit}>
            <ArrowLeft /> Back
          </ChunkyButton>
          <ChunkyButton type="button" tone="success" size="lg" disabled={pending} onClick={start}>
            {pending ? "Looking for an opponent…" : "Start duel"}
          </ChunkyButton>
        </div>
      </ArenaCard>
    );
  }

  const total = questions.length;
  const question = questions[index];
  const activeIndex = reveal || phase === "finished" ? -1 : index;
  const lastBotCorrect = botResults[botResults.length - 1];

  return (
    <div className="mx-auto grid w-full max-w-4xl grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 sm:gap-6">
      <ScoreColumn label="You" icon={<User className="size-5" />} results={userResults} total={total} activeIndex={activeIndex} />

      {phase === "finished" && summary ? (
        <ArenaCard className="flex flex-col items-center gap-5 p-8 text-center">
          <Trophy className="size-12 text-amber-500" />
          <h2 className="text-2xl font-extrabold">{OUTCOME_TITLES[summary.outcome]}</h2>
          <p className="text-5xl font-extrabold">
            {summary.userScore} : {summary.botScore}
          </p>
          <p className="rounded-xl bg-muted px-4 py-2 font-bold">+{summary.xp} XP</p>
          <ErrorLine message={error} />
          <div className="flex flex-wrap justify-center gap-3">
            <ChunkyButton type="button" tone="outline-none" size="lg" onClick={onExit}>
              <ArrowLeft /> Menu
            </ChunkyButton>
            <ChunkyButton type="button" tone="success" size="lg" disabled={pending} onClick={start}>
              {pending ? "Looking for an opponent…" : "Play again"}
            </ChunkyButton>
          </div>
        </ArenaCard>
      ) : (
        <ArenaCard className="flex flex-col gap-4">
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
              let state: OptionState = "idle";
              if (reveal) {
                if (reveal.correctOptionId === option.id) state = "best";
                else if (reveal.selectedId === option.id) state = "wrong";
                else state = "dim";
              }
              return (
                <li key={option.id}>
                  <OptionButton label={option.label} state={state} disabled={Boolean(reveal) || pending} onClick={() => choose(option.id)} />
                </li>
              );
            })}
          </ul>

          <div aria-live="polite">
            {reveal && (
              <div
                className={cn(
                  "rounded-2xl border-2 p-4",
                  reveal.correct ? "border-green-500/50 bg-green-500/10" : "border-amber-500/50 bg-amber-500/10"
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

          <ErrorLine message={error} />

          {reveal && (
            <div className="flex justify-end">
              <ChunkyButton type="button" tone="success" size="lg" onClick={next}>
                {summary ? "See result" : "Next question"}
              </ChunkyButton>
            </div>
          )}
        </ArenaCard>
      )}

      <ScoreColumn label="Bot" icon={<Bot className="size-5" />} results={botResults} total={total} activeIndex={activeIndex} />
    </div>
  );
}
