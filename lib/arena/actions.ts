// lib/arena/actions.ts
//
// Akcje serwerowe areny: start pojedynku z botem i sprawdzanie odpowiedzi.
// Poprawne odpowiedzi nie trafiają do przeglądarki przed udzieleniem odpowiedzi,
// a XP jest naliczane tylko tutaj, po ostatnim pytaniu.
"use server";

import { prisma } from "@/lib/prisma";
import { currentTime, utcDateKey } from "@/lib/clock";
import { getSession } from "@/lib/session";
import type { AnswerResult, StartDuelResult } from "@/types/arena";
import { BOT_DIFFICULTIES, XP_REWARDS, isBotDifficulty, type BotDifficulty } from "./config";
import { loadQuestions, pickQuestionIds } from "./pool";
import { outcomeOf } from "./scoring";

type AnswerRecord = { questionId: string; optionId: string; correct: boolean };

const failAnswer = (error: string): AnswerResult => ({ ok: false, error });

const xpFor = (outcome: keyof typeof XP_REWARDS, difficulty: BotDifficulty) =>
  Math.round(XP_REWARDS[outcome] * BOT_DIFFICULTIES[difficulty].xpMultiplier);

export async function startDuel(difficulty: BotDifficulty): Promise<StartDuelResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Sign in to play in the Arena." };
  if (!isBotDifficulty(difficulty)) return { ok: false, error: "Unknown difficulty." };

  // Pula pytań: zadania dzienne bez dzisiejszego (zob. lib/arena/pool.ts i ARENA_INCLUDE_UNSCHEDULED).
  const questionIds = await pickQuestionIds(utcDateKey(await currentTime()));
  if (questionIds.length === 0) return { ok: false, error: "No questions available yet." };

  // true = bot odpowie poprawnie na to pytanie
  const accuracy = BOT_DIFFICULTIES[difficulty].accuracy;
  const botPlan = questionIds.map(() => Math.random() < accuracy);

  const questions = await loadQuestions(questionIds, true);
  if (!questions) return { ok: false, error: "Could not load the questions. Try again." };

  const duel = await prisma.arenaDuel.create({
    data: { userId: session.user.id, difficulty, questionIds, botPlan, answers: [] },
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

  const now = await currentTime();
  const correct = chosen.isOptimal;
  const botCorrect = botPlan[index] === true;
  const userScore = duel.userScore + (correct ? 1 : 0);
  const botScore = duel.botScore + (botCorrect ? 1 : 0);

  const finished = index + 1 >= questionIds.length;
  const outcome = finished ? outcomeOf(userScore, botScore) : undefined;
  const xp = outcome ? xpFor(outcome, duel.difficulty) : 0;

  const saved = await prisma.$transaction(async (tx) => {
    // Warunek answeredCount: index chroni przed podwójnym wysłaniem tej samej odpowiedzi.
    const updated = await tx.arenaDuel.updateMany({
      where: { id: duel.id, userId, status: "in_progress", answeredCount: index },
      data: {
        answeredCount: index + 1,
        userScore,
        botScore,
        answers: [...answers, { questionId, optionId, correct }],
        ...(finished ? { status: "finished" as const, xpAwarded: xp, finishedAt: now } : {}),
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