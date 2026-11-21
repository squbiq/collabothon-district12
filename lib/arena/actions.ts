// lib/arena/actions.ts
//
// Akcje serwerowe areny: start pojedynku z botem i sprawdzanie odpowiedzi.
// Poprawne odpowiedzi nie trafiają do przeglądarki przed udzieleniem odpowiedzi,
// a XP jest naliczane tylko tutaj, po ostatnim pytaniu.
"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import type { AnswerResult, ArenaQuestion, DuelOutcome, StartDuelResult } from "@/types/arena";
import { ARENA_ROUNDS, BOT_ACCURACY, XP_REWARDS } from "./config";

type AnswerRecord = { questionId: string; optionId: string; correct: boolean };

const failAnswer = (error: string): AnswerResult => ({ ok: false, error });

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function outcomeOf(user: number, bot: number): DuelOutcome {
  if (user > bot) return "win";
  if (user < bot) return "loss";
  return "draw";
}

export async function startDuel(): Promise<StartDuelResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Sign in to play in the Arena." };

  // Pula: tylko archiwalne daily lessons (starsze niż dzisiejsza), żeby arena
  // nie zdradzała odpowiedzi na dzisiejsze wyzwanie. Zmień "lt" na "lte", żeby dodać dzisiejsze.
  const todayKey = new Date().toISOString().slice(0, 10);
  const pool = await prisma.dailyLesson.findMany({
    where: { dateKey: { lt: todayKey }, options: { some: { isOptimal: true } } },
    select: { id: true, _count: { select: { options: true } } },
  });
  const usable = pool.filter((q) => q._count.options >= 2).map((q) => q.id);
  if (usable.length === 0) return { ok: false, error: "No questions available yet." };

  const questionIds = shuffle(usable).slice(0, ARENA_ROUNDS);
  // true = bot odpowie poprawnie na to pytanie
  const botPlan = questionIds.map(() => Math.random() < BOT_ACCURACY);

  const rows = await prisma.dailyLesson.findMany({
    where: { id: { in: questionIds } },
    select: {
      id: true,
      category: true,
      title: true,
      scenario: true,
      options: { select: { id: true, label: true } }, // bez isOptimal i feedback
    },
  });
  const byId = new Map(rows.map((r) => [r.id, r]));

  const questions: ArenaQuestion[] = questionIds.flatMap((id) => {
    const q = byId.get(id);
    return q ? [{ ...q, options: shuffle(q.options) }] : [];
  });
  if (questions.length !== questionIds.length) {
    return { ok: false, error: "Could not load the questions. Try again." };
  }

  const duel = await prisma.arenaDuel.create({
    data: { userId: session.user.id, questionIds, botPlan, answers: [] },
    select: { id: true },
  });

  return { ok: true, duelId: duel.id, questions };
}

export async function answerQuestion(
  duelId: string,
  questionId: string,
  optionId: string
): Promise<AnswerResult> {
  const session = await getSession();
  if (!session) return failAnswer("Sign in to play in the Arena.");
  const userId = session.user.id;

  const duel = await prisma.arenaDuel.findFirst({
    where: { id: duelId, userId, status: "in_progress" },
  });
  if (!duel) return failAnswer("This duel is no longer active.");

  const questionIds = duel.questionIds as string[];
  const botPlan = duel.botPlan as boolean[];
  const answers = duel.answers as unknown as AnswerRecord[];
  const index = duel.answeredCount;

  // Pytania muszą być odpowiadane po kolei, każde tylko raz.
  if (questionIds[index] !== questionId) return failAnswer("Unexpected question.");

  const options = await prisma.dailyOption.findMany({
    where: { dailyLessonId: questionId },
    select: { id: true, isOptimal: true, feedback: true },
  });
  const chosen = options.find((o) => o.id === optionId);
  if (!chosen) return failAnswer("Invalid option.");
  const best = options.find((o) => o.isOptimal);
  if (!best) return failAnswer("This question is misconfigured.");

  const correct = chosen.isOptimal;
  const botCorrect = botPlan[index] === true;
  const userScore = duel.userScore + (correct ? 1 : 0);
  const botScore = duel.botScore + (botCorrect ? 1 : 0);

  const finished = index + 1 >= questionIds.length;
  const outcome = finished ? outcomeOf(userScore, botScore) : undefined;
  const xp = outcome ? XP_REWARDS[outcome] : 0;

  const saved = await prisma.$transaction(async (tx) => {
    // Warunek answeredCount: index chroni przed podwójnym wysłaniem tej samej odpowiedzi.
    const updated = await tx.arenaDuel.updateMany({
      where: { id: duel.id, userId, status: "in_progress", answeredCount: index },
      data: {
        answeredCount: index + 1,
        userScore,
        botScore,
        answers: [...answers, { questionId, optionId, correct }],
        ...(finished ? { status: "finished" as const, xpAwarded: xp, finishedAt: new Date() } : {}),
      },
    });
    if (updated.count === 0) return false;

    // Jeśli kolega ma już funkcję naliczającą XP, wywołaj ją tutaj zamiast tego update.
    if (finished) {
      await tx.user.update({ where: { id: userId }, data: { experience: { increment: xp } } });
    }
    return true;
  });
  if (!saved) return failAnswer("This question was already answered.");

  return {
    ok: true,
    correct,
    correctOptionId: correct ? chosen.id : best.id,
    feedback: chosen.feedback,
    botCorrect,
    userScore,
    botScore,
    finished,
    outcome,
    xp: finished ? xp : undefined,
  };
}