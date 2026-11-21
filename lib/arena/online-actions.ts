// lib/arena/online-actions.ts
//
// Akcje serwerowe meczu online (2 graczy). Stan jest w bazie, klienci odpytują serwer co ONLINE_POLL_MS.
// Wszystkie czasy mierzy serwer (lib/clock), więc o szybkości nie decyduje zegar przeglądarki.
// Poprawne odpowiedzi nie trafiają do klienta przed udzieleniem odpowiedzi.
"use server";

import { prisma } from "@/lib/prisma";
import { currentTime, utcDateKey } from "@/lib/clock";
import { getSession } from "@/lib/session";
import type {
  FindMatchResult,
  MatchAnswerResult,
  MatchPlayerView,
  MatchResult,
  MatchState,
} from "@/types/arena";
import {
  ONLINE_IDLE_FORFEIT_SECONDS,
  ONLINE_QUESTION_SECONDS,
  ONLINE_REVEAL_SECONDS,
  ONLINE_SEARCH_TIMEOUT_SECONDS,
  ONLINE_START_COUNTDOWN_SECONDS,
  ONLINE_XP_REWARDS,
} from "./config";
import { loadQuestions, pickQuestionIds } from "./pool";
import { answerPoints, outcomeOf } from "./scoring";

const SIGN_IN = "Sign in to play in the Arena.";
/// Tyle ms zapasu na opóźnienie sieci przy sprawdzaniu, czy odpowiedź nie przyszła za wcześnie / za późno.
const GRACE_MS = 2000;

const seconds = (n: number) => n * 1000;

type AnswerRow = { userId: string; position: number; correct: boolean; points: number; answeredAt: Date };
type MatchRow = {
  id: string;
  status: "waiting" | "in_progress" | "finished" | "cancelled";
  hostId: string;
  guestId: string | null;
  questionIds: unknown;
  hostXp: number;
  guestXp: number;
  createdAt: Date;
  startedAt: Date | null;
  answers: AnswerRow[];
  host: { id: string; name: string; username: string | null; displayUsername: string | null };
  guest: { id: string; name: string; username: string | null; displayUsername: string | null } | null;
};

const MATCH_INCLUDE = {
  answers: { select: { userId: true, position: true, correct: true, points: true, answeredAt: true } },
  host: { select: { id: true, name: true, username: true, displayUsername: true } },
  guest: { select: { id: true, name: true, username: true, displayUsername: true } },
} as const;

const displayName = (u: { name: string; username: string | null; displayUsername: string | null }) =>
  u.displayUsername ?? u.username ?? u.name;

const idsOf = (match: MatchRow) => match.questionIds as string[];

/** Kiedy zaczyna się pytanie o numerze `position` dla danego gracza. */
function questionStart(match: MatchRow, mine: AnswerRow[], position: number): number {
  if (position === 0) return (match.startedAt?.getTime() ?? 0) + seconds(ONLINE_START_COUNTDOWN_SECONDS);
  const previous = mine.find((a) => a.position === position - 1);
  return (previous?.answeredAt.getTime() ?? 0) + seconds(ONLINE_REVEAL_SECONDS);
}

/** Ostatnia aktywność gracza (do wykrywania porzuconych meczów). */
function lastActivity(match: MatchRow, mine: AnswerRow[]): number {
  const times = mine.map((a) => a.answeredAt.getTime());
  return Math.max(match.startedAt?.getTime() ?? 0, ...times);
}

/**
 * Kończy mecz, gdy obaj gracze skończyli albo oddali go walkowerem (brak aktywności).
 * Idempotentne: XP naliczamy tylko wtedy, gdy to my przestawiliśmy status z in_progress na finished.
 */
async function settleMatch(matchId: string, now: Date): Promise<void> {
  const match = (await prisma.arenaMatch.findUnique({ where: { id: matchId }, include: MATCH_INCLUDE })) as MatchRow | null;
  if (!match || match.status !== "in_progress" || !match.guestId) return;

  const total = idsOf(match).length;
  const side = (userId: string) => {
    const mine = match.answers.filter((a) => a.userId === userId);
    const done = mine.length >= total;
    const idle = now.getTime() - lastActivity(match, mine) > seconds(ONLINE_IDLE_FORFEIT_SECONDS);
    return { points: mine.reduce((sum, a) => sum + a.points, 0), done, forfeit: !done && idle };
  };
  const host = side(match.hostId);
  const guest = side(match.guestId);
  if (!((host.done || host.forfeit) && (guest.done || guest.forfeit))) return;

  const hostOutcome = outcomeOf(host.points, guest.points);
  const guestOutcome = outcomeOf(guest.points, host.points);
  // Walkower = brak nagrody za porażkę.
  const hostXp = host.forfeit ? 0 : ONLINE_XP_REWARDS[hostOutcome];
  const guestXp = guest.forfeit ? 0 : ONLINE_XP_REWARDS[guestOutcome];

  await prisma.$transaction(async (tx) => {
    const updated = await tx.arenaMatch.updateMany({
      where: { id: match.id, status: "in_progress" },
      data: { status: "finished", finishedAt: now, hostXp, guestXp },
    });
    if (updated.count === 0) return;
    if (hostXp > 0) await tx.user.update({ where: { id: match.hostId }, data: { experience: { increment: hostXp } } });
    if (guestXp > 0) await tx.user.update({ where: { id: match.guestId! }, data: { experience: { increment: guestXp } } });
  });
}

function playerView(match: MatchRow, userId: string, viewerAnswered: number, hidden: boolean): MatchPlayerView {
  const user = userId === match.hostId ? match.host : match.guest;
  const mine = match.answers.filter((a) => a.userId === userId).sort((a, b) => a.position - b.position);
  // Rywal: wyniki i punkty tylko za pytania, na które już odpowiedziałeś (nie zdradzamy poprawnych odpowiedzi).
  const visible = hidden ? mine.filter((a) => a.position < viewerAnswered) : mine;
  return {
    name: user ? displayName(user) : "Opponent",
    answered: mine.length,
    points: visible.reduce((sum, a) => sum + a.points, 0),
    results: mine.map((a) => (hidden && a.position >= viewerAnswered ? null : a.correct)),
  };
}

async function buildState(match: MatchRow, userId: string, now: Date, withQuestions: boolean): Promise<MatchState> {
  const opponentId = userId === match.hostId ? match.guestId : match.hostId;
  if (!opponentId) return { ok: false, error: "Match not found." };

  const total = idsOf(match).length;
  const mine = match.answers.filter((a) => a.userId === userId);
  const me = playerView(match, userId, mine.length, false);
  const opponent = playerView(match, opponentId, mine.length, match.status === "in_progress");

  let result: MatchResult | undefined;
  if (match.status === "finished") {
    const theirs = match.answers.filter((a) => a.userId === opponentId);
    const myPoints = mine.reduce((sum, a) => sum + a.points, 0);
    const opponentPoints = theirs.reduce((sum, a) => sum + a.points, 0);
    const amHost = userId === match.hostId;
    result = {
      outcome: outcomeOf(myPoints, opponentPoints),
      myPoints,
      opponentPoints,
      xp: amHost ? match.hostXp : match.guestXp,
      forfeit: mine.length < total ? "me" : theirs.length < total ? "opponent" : null,
    };
    // po zakończeniu pokazujemy pełne wyniki obu stron
    opponent.points = opponentPoints;
    opponent.results = theirs.sort((a, b) => a.position - b.position).map((a) => a.correct);
  }

  let questions;
  if (withQuestions) {
    questions = (await loadQuestions(idsOf(match))) ?? undefined;
    if (!questions) return { ok: false, error: "Could not load the questions." };
  }

  const position = Math.min(mine.length, total - 1);
  return {
    ok: true,
    status: match.status === "finished" ? "finished" : "in_progress",
    matchId: match.id,
    questions,
    total,
    currentStartsInMs: questionStart(match, mine, position) - now.getTime(),
    me,
    opponent,
    result,
  };
}

// ---------- Akcje ----------

/** Szuka rywala: dołącza do czekającego meczu albo zakłada nowy. Wznawia aktywny mecz, jeśli taki jest. */
export async function findMatch(): Promise<FindMatchResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: SIGN_IN };
  const userId = session.user.id;
  const now = await currentTime();
  const cutoff = new Date(now.getTime() - seconds(ONLINE_SEARCH_TIMEOUT_SECONDS));

  // 1) mecze, w których już jestem: dokończ rozliczanie porzuconych, aktywny wznów, stare oczekiwanie usuń
  const mine = await prisma.arenaMatch.findMany({
    where: { status: { in: ["waiting", "in_progress"] }, OR: [{ hostId: userId }, { guestId: userId }] },
    select: { id: true, status: true, createdAt: true },
  });
  for (const m of mine) {
    if (m.status === "in_progress") await settleMatch(m.id, now);
    else if (m.createdAt < cutoff) {
      await prisma.arenaMatch.updateMany({ where: { id: m.id, status: "waiting" }, data: { status: "cancelled" } });
    }
  }
  const active = await prisma.arenaMatch.findFirst({
    where: {
      OR: [
        { status: "in_progress", OR: [{ hostId: userId }, { guestId: userId }] },
        { status: "waiting", hostId: userId, createdAt: { gte: cutoff } },
      ],
    },
    select: { id: true },
  });
  if (active) return { ok: true, matchId: active.id };

  // 2) dołącz do cudzego czekającego meczu (compare-and-set chroni przed dwoma gośćmi naraz)
  const candidates = await prisma.arenaMatch.findMany({
    where: { status: "waiting", guestId: null, hostId: { not: userId }, createdAt: { gte: cutoff } },
    orderBy: { createdAt: "asc" },
    select: { id: true },
    take: 5,
  });
  for (const candidate of candidates) {
    const joined = await prisma.arenaMatch.updateMany({
      where: { id: candidate.id, status: "waiting", guestId: null },
      data: { guestId: userId, status: "in_progress", startedAt: now },
    });
    if (joined.count === 1) return { ok: true, matchId: candidate.id };
  }

  // 3) nikt nie czeka – zakładamy własny mecz i czekamy na rywala
  const questionIds = await pickQuestionIds(utcDateKey(now));
  if (questionIds.length === 0) return { ok: false, error: "No questions available yet." };
  const created = await prisma.arenaMatch.create({ data: { hostId: userId, questionIds }, select: { id: true } });
  return { ok: true, matchId: created.id };
}

/** Stan meczu dla gracza (polling). `withQuestions` tylko przy pierwszym zapytaniu po starcie meczu. */
export async function getMatchState(matchId: string, withQuestions = false): Promise<MatchState> {
  const session = await getSession();
  if (!session) return { ok: false, error: SIGN_IN };
  const userId = session.user.id;
  const now = await currentTime();

  await settleMatch(matchId, now);
  const match = (await prisma.arenaMatch.findFirst({
    where: { id: matchId, OR: [{ hostId: userId }, { guestId: userId }] },
    include: MATCH_INCLUDE,
  })) as MatchRow | null;
  if (!match) return { ok: false, error: "Match not found." };

  if (match.status === "cancelled") return { ok: true, status: "cancelled", matchId };
  if (match.status === "waiting") {
    if (now.getTime() - match.createdAt.getTime() > seconds(ONLINE_SEARCH_TIMEOUT_SECONDS)) {
      await prisma.arenaMatch.updateMany({ where: { id: matchId, status: "waiting" }, data: { status: "cancelled" } });
      return { ok: true, status: "expired", matchId };
    }
    return { ok: true, status: "waiting", matchId };
  }
  return buildState(match, userId, now, withQuestions);
}

/** Rezygnacja z wyszukiwania rywala. */
export async function cancelSearch(matchId: string): Promise<{ ok: boolean }> {
  const session = await getSession();
  if (!session) return { ok: false };
  const result = await prisma.arenaMatch.updateMany({
    where: { id: matchId, hostId: session.user.id, status: "waiting" },
    data: { status: "cancelled" },
  });
  return { ok: result.count === 1 };
}

/** Odpowiedź na pytanie `position`. `optionId = null` oznacza, że czas minął. */
export async function submitMatchAnswer(
  matchId: string,
  position: number,
  optionId: string | null
): Promise<MatchAnswerResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: SIGN_IN };
  const userId = session.user.id;
  const now = await currentTime();

  const match = (await prisma.arenaMatch.findFirst({
    where: { id: matchId, status: "in_progress", OR: [{ hostId: userId }, { guestId: userId }] },
    include: MATCH_INCLUDE,
  })) as MatchRow | null;
  if (!match) return { ok: false, error: "This match is no longer active." };

  const ids = idsOf(match);
  const mine = match.answers.filter((a) => a.userId === userId);
  // pytania po kolei, każde tylko raz
  if (position !== mine.length || position >= ids.length) return { ok: false, error: "Unexpected question." };

  const startedAt = questionStart(match, mine, position);
  if (now.getTime() < startedAt - GRACE_MS) return { ok: false, error: "This question has not started yet." };

  const options = await prisma.dailyOption.findMany({
    where: { dailyLessonId: ids[position] },
    select: { id: true, isOptimal: true, feedback: true },
  });
  const best = options.find((o) => o.isOptimal);
  if (!best) return { ok: false, error: "This question is misconfigured." };
  const chosen = optionId ? options.find((o) => o.id === optionId) : undefined;
  if (optionId && !chosen) return { ok: false, error: "Invalid option." };

  const responseMs = Math.max(0, now.getTime() - startedAt);
  const timedOut = !chosen || responseMs > seconds(ONLINE_QUESTION_SECONDS) + GRACE_MS;
  const correct = !timedOut && chosen!.isOptimal;
  const points = answerPoints(correct, responseMs);

  try {
    await prisma.arenaMatchAnswer.create({
      data: { matchId, userId, position, optionId: timedOut ? null : chosen!.id, correct, responseMs, points, answeredAt: now },
    });
  } catch (error) {
    // unikalny klucz (matchId, userId, position): to pytanie zostało już zapisane
    if ((error as { code?: string }).code === "P2002") return { ok: false, error: "This question was already answered." };
    throw error;
  }
  await settleMatch(matchId, now);

  return {
    ok: true,
    position,
    correct,
    timedOut,
    correctOptionId: best.id,
    feedback: chosen?.feedback ?? "Time is up – no answer was recorded.",
    points,
    responseMs,
    nextStartsInMs: position + 1 < ids.length ? seconds(ONLINE_REVEAL_SECONDS) : null,
  };
}
