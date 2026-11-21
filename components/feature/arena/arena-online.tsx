// components/feature/arena/arena-online.tsx
//
// Mecz online: dwóch graczy, te same pytania. Liczy się poprawność i szybkość (czas mierzy serwer).
// Klient odpytuje serwer co ONLINE_POLL_MS – bez websocketów.
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bot, Loader2, Swords, Timer, Trophy, User, Zap } from "lucide-react";
import { ChunkyButton } from "@/components/shared/chunky-button";
import { cancelSearch, findMatch, getMatchState, submitMatchAnswer } from "@/lib/arena/online-actions";
import {
  ARENA_ROUNDS,
  ONLINE_CORRECT_POINTS,
  ONLINE_POLL_MS,
  ONLINE_QUESTION_SECONDS,
  ONLINE_SEARCH_TIMEOUT_SECONDS,
  ONLINE_SPEED_BONUS_MAX,
  ONLINE_XP_REWARDS,
} from "@/lib/arena/config";
import { cn } from "@/lib/utils";
import type { ArenaQuestion, DuelOutcome, MatchAnswerResult, MatchState } from "@/types/arena";
import { ArenaCard, ErrorLine, OptionButton, ScoreColumn, type DotResult, type OptionState } from "./arena-parts";

type Phase = "idle" | "searching" | "playing" | "finished";
type InPlay = Extract<MatchState, { ok: true; status: "in_progress" | "finished" }>;
type AnswerOk = Extract<MatchAnswerResult, { ok: true }>;
type Reveal = { position: number; selectedId: string | null; result: AnswerOk };
/** `startAt` to lokalny czas (ms), od którego odpowiada się na pytanie `position`. */
type Schedule = { position: number; startAt: number };

const OUTCOME_TITLES: Record<DuelOutcome, string> = {
  win: "You won the match!",
  draw: "It's a draw",
  loss: "Your opponent was faster this time",
};

const QUESTION_MS = ONLINE_QUESTION_SECONDS * 1000;

export function ArenaOnline({ onExit, onPlayBot }: { onExit: () => void; onPlayBot: () => void }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [finding, setFinding] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [searchStart, setSearchStart] = useState(0);
  const [now, setNow] = useState(0);
  const [questions, setQuestions] = useState<ArenaQuestion[]>([]);
  const [match, setMatch] = useState<InPlay | null>(null);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [reveal, setReveal] = useState<Reveal | null>(null);

  async function start() {
    setError(null);
    setNotice(null);
    setFinding(true);
    const result = await findMatch();
    setFinding(false);
    if (!result.ok) return setError(result.error);
    setMatchId(result.matchId);
    setQuestions([]);
    setMatch(null);
    setSchedule(null);
    setReveal(null);
    setSearchStart(Date.now());
    setNow(Date.now());
    setPhase("searching");
  }

  async function stopSearching(thenBot: boolean) {
    if (matchId) await cancelSearch(matchId);
    setMatchId(null);
    setPhase("idle");
    if (thenBot) onPlayBot();
  }

  async function submit(optionId: string | null) {
    if (!matchId || !schedule || submitting) return;
    const position = schedule.position;
    setSubmitting(true);
    setError(null);
    const result = await submitMatchAnswer(matchId, position, optionId);
    setSubmitting(false);
    if (!result.ok) return setError(result.error);
    setReveal({ position, selectedId: optionId, result });
    if (result.nextStartsInMs !== null) setSchedule({ position: position + 1, startAt: Date.now() + result.nextStartsInMs });
  }

  // Timer wywołuje najświeższą wersję submit (bez ponownego tworzenia interwałów przy każdym renderze).
  const submitRef = useRef(submit);
  useEffect(() => {
    submitRef.current = submit;
  });

  // Polling stanu meczu.
  useEffect(() => {
    if (!matchId || (phase !== "searching" && phase !== "playing")) return;
    let cancelled = false;
    const needQuestions = questions.length === 0;

    const poll = async () => {
      const res = await getMatchState(matchId, needQuestions);
      if (cancelled) return;
      if (!res.ok) return setError(res.error);
      if (res.status === "expired" || res.status === "cancelled") {
        setNotice("No opponent showed up. Try again, or play against the bot.");
        setMatchId(null);
        return setPhase("idle");
      }
      if (!("me" in res)) return; // waiting: czekamy na rywala

      if (res.questions) setQuestions(res.questions);
      setMatch(res);
      setNow(Date.now());
      const position = Math.min(res.me.answered, res.total - 1);
      // nieaktualna odpowiedź serwera nie może cofnąć bieżącego pytania
      setSchedule((prev) => (prev && prev.position >= position ? prev : { position, startAt: Date.now() + res.currentStartsInMs }));
      if (res.status === "finished") {
        setPhase("finished");
        router.refresh(); // XP jest już zapisane
      } else {
        setPhase("playing");
      }
    };

    const id = setInterval(poll, ONLINE_POLL_MS);
    void poll();
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [matchId, phase, questions.length, router]);

  // Zegar interfejsu (odliczanie i pasek czasu).
  useEffect(() => {
    if (phase !== "searching" && phase !== "playing") return;
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, [phase]);

  const total = match?.total ?? questions.length;
  const position = schedule?.position ?? 0;
  const answeredHere = reveal?.position === position || (match ? match.me.answered > position : false);

  // Czas minął: wysyłamy brak odpowiedzi (serwer sam też pilnuje limitu).
  useEffect(() => {
    if (phase !== "playing" || !schedule || answeredHere) return;
    const delay = schedule.startAt + QUESTION_MS - Date.now();
    const id = setTimeout(() => void submitRef.current(null), Math.max(0, delay));
    return () => clearTimeout(id);
  }, [phase, schedule, answeredHere]);

  // ---------- Ekrany ----------

  if (phase === "idle") {
    return (
      <ArenaCard className="mx-auto flex w-full max-w-xl flex-col items-center gap-5 p-8 text-center">
        <Swords className="size-12 text-sky-500" />
        <h2 className="text-2xl font-extrabold">Play online</h2>
        <p className="text-muted-foreground">
          Same {ARENA_ROUNDS} questions for both of you, {ONLINE_QUESTION_SECONDS} seconds each. A correct answer is worth{" "}
          {ONLINE_CORRECT_POINTS} points, plus up to {ONLINE_SPEED_BONUS_MAX} for speed. Most points wins.
        </p>
        <div className="flex flex-wrap justify-center gap-2 text-sm font-bold">
          {(["win", "draw", "loss"] as const).map((key) => (
            <span key={key} className="rounded-xl bg-muted px-3 py-1 capitalize">
              {key} +{ONLINE_XP_REWARDS[key]} XP
            </span>
          ))}
        </div>
        {notice && <p className="text-sm font-medium text-amber-600 dark:text-amber-400">{notice}</p>}
        <ErrorLine message={error} />
        <div className="flex flex-wrap justify-center gap-3">
          <ChunkyButton type="button" tone="outline-none" size="lg" onClick={onExit}>
            <ArrowLeft /> Back
          </ChunkyButton>
          <ChunkyButton type="button" tone="success" size="lg" disabled={finding} onClick={() => void start()}>
            {finding ? "Connecting…" : "Find an opponent"}
          </ChunkyButton>
        </div>
      </ArenaCard>
    );
  }

  if (!match || !schedule || questions.length === 0) {
    const elapsed = Math.max(0, Math.floor((now - searchStart) / 1000));
    return (
      <ArenaCard className="mx-auto flex w-full max-w-xl flex-col items-center gap-5 p-8 text-center">
        <Loader2 className="size-12 animate-spin text-sky-500 motion-reduce:animate-none" />
        <h2 className="text-2xl font-extrabold">Looking for an opponent…</h2>
        <p className="text-muted-foreground tabular-nums">
          {elapsed}s / {ONLINE_SEARCH_TIMEOUT_SECONDS}s – the match starts as soon as someone joins.
        </p>
        <ErrorLine message={error} />
        <div className="flex flex-wrap justify-center gap-3">
          <ChunkyButton type="button" tone="outline-none" size="lg" onClick={() => void stopSearching(false)}>
            Cancel
          </ChunkyButton>
          <ChunkyButton type="button" tone="primary" size="lg" onClick={() => void stopSearching(true)}>
            <Bot /> Play the bot instead
          </ChunkyButton>
        </div>
      </ArenaCard>
    );
  }

  // Mój wynik wyprzedza odpowiedź serwera, dopóki nie przyjdzie kolejny polling.
  const myResults: DotResult[] = [...match.me.results];
  let myPoints = match.me.points;
  if (reveal && reveal.position >= myResults.length) {
    myResults[reveal.position] = reveal.result.correct;
    myPoints += reveal.result.points;
  }
  const finishedMine = match.status === "finished" || match.me.answered >= total || reveal?.position === total - 1;
  const activeIndex = phase === "finished" || finishedMine ? -1 : position;

  const columns = (center: React.ReactNode) => (
    <div className="mx-auto grid w-full max-w-4xl grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 sm:gap-6">
      <ScoreColumn
        label="You"
        icon={<User className="size-5" />}
        results={myResults}
        total={total}
        activeIndex={activeIndex}
        footer={<Points value={match.result?.myPoints ?? myPoints} />}
      />
      {center}
      <ScoreColumn
        label={match.opponent.name}
        icon={<Swords className="size-5" />}
        results={match.opponent.results}
        total={total}
        activeIndex={-1}
        footer={<Points value={match.result?.opponentPoints ?? match.opponent.points} />}
      />
    </div>
  );

  if (phase === "finished" && match.result) {
    const { result } = match;
    return columns(
      <ArenaCard className="flex flex-col items-center gap-5 p-8 text-center">
        <Trophy className="size-12 text-amber-500" />
        <h2 className="text-2xl font-extrabold">{OUTCOME_TITLES[result.outcome]}</h2>
        <p className="text-5xl font-extrabold tabular-nums">
          {result.myPoints} : {result.opponentPoints}
        </p>
        {result.forfeit && (
          <p className="text-sm font-medium text-muted-foreground">
            {result.forfeit === "opponent" ? "Your opponent left the match." : "You stopped answering, so the match was ended."}
          </p>
        )}
        <p className="rounded-xl bg-muted px-4 py-2 font-bold">+{result.xp} XP</p>
        <div className="flex flex-wrap justify-center gap-3">
          <ChunkyButton type="button" tone="outline-none" size="lg" onClick={onExit}>
            <ArrowLeft /> Menu
          </ChunkyButton>
          <ChunkyButton type="button" tone="success" size="lg" disabled={finding} onClick={() => void start()}>
            {finding ? "Connecting…" : "Play again"}
          </ChunkyButton>
        </div>
      </ArenaCard>
    );
  }

  const lastReveal = reveal && reveal.position === position ? reveal : reveal && reveal.position === position - 1 ? reveal : null;

  if (finishedMine) {
    return columns(
      <ArenaCard className="flex flex-col gap-4">
        {reveal && <RevealBox reveal={reveal} />}
        <p className="flex items-center justify-center gap-2 font-bold text-muted-foreground">
          <Loader2 className="size-5 animate-spin motion-reduce:animate-none" /> Waiting for {match.opponent.name} to finish…
        </p>
      </ArenaCard>
    );
  }

  const untilStart = Math.max(0, Math.ceil((schedule.startAt - now) / 1000));
  if (now < schedule.startAt) {
    return columns(
      <ArenaCard className="flex flex-col items-center gap-4 text-center">
        {lastReveal && <RevealBox reveal={lastReveal} />}
        <p className="font-bold text-muted-foreground">{position === 0 ? "Get ready!" : "Next question in"}</p>
        <p className="text-6xl font-extrabold tabular-nums">{untilStart}</p>
      </ArenaCard>
    );
  }

  const question = questions[position];
  const secondsLeft = Math.max(0, (schedule.startAt + QUESTION_MS - now) / 1000);
  const shown = reveal?.position === position ? reveal : null;

  return columns(
    <ArenaCard className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-xl bg-muted px-3 py-1 text-sm font-bold">{question.category}</span>
        <span className="text-sm font-bold text-muted-foreground">
          Question {position + 1} / {total}
        </span>
      </div>

      <div
        role="timer"
        aria-label="Time left"
        className="flex items-center gap-3"
      >
        <Timer className="size-5 shrink-0 text-muted-foreground" />
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full transition-[width] duration-200 ease-linear", secondsLeft <= 5 ? "bg-red-500" : "bg-sky-500")}
            style={{ width: `${shown ? 0 : (secondsLeft / ONLINE_QUESTION_SECONDS) * 100}%` }}
          />
        </div>
        <span className="w-8 text-right text-sm font-extrabold tabular-nums">{shown ? "" : Math.ceil(secondsLeft)}</span>
      </div>

      <h2 className="text-xl font-extrabold">{question.title}</h2>
      <p className="leading-relaxed text-foreground/90">{question.scenario}</p>

      <ul className="flex flex-col gap-3">
        {question.options.map((option) => {
          let state: OptionState = "idle";
          if (shown) {
            if (shown.result.correctOptionId === option.id) state = "best";
            else if (shown.selectedId === option.id) state = "wrong";
            else state = "dim";
          }
          return (
            <li key={option.id}>
              <OptionButton label={option.label} state={state} disabled={Boolean(shown) || submitting} onClick={() => void submit(option.id)} />
            </li>
          );
        })}
      </ul>

      {shown && <RevealBox reveal={shown} />}
      <ErrorLine message={error} />
    </ArenaCard>
  );
}

function Points({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-1 text-sm font-extrabold tabular-nums">
      <Zap className="size-4 text-amber-500" /> {value}
    </span>
  );
}

function RevealBox({ reveal }: { reveal: Reveal }) {
  const { result } = reveal;
  return (
    <div
      aria-live="polite"
      className={cn(
        "w-full rounded-2xl border-2 p-4 text-left",
        result.correct ? "border-green-500/50 bg-green-500/10" : "border-amber-500/50 bg-amber-500/10"
      )}
    >
      <p className="font-extrabold">
        {result.timedOut ? "Time is up" : result.correct ? "Correct!" : "Not quite"}
        <span className="ml-2 text-sm font-bold text-muted-foreground tabular-nums">
          +{result.points} pts · {(result.responseMs / 1000).toFixed(1)} s
        </span>
      </p>
      <p className="mt-1 text-sm font-medium">{result.feedback}</p>
    </div>
  );
}
