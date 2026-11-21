// lib/arena/pool.ts
//
// Pula pytań areny = zadania dzienne (DailyLesson). Dzisiejsze zadanie nigdy nie trafia do areny,
// żeby nie zdradzać odpowiedzi na dzienną misję.
import "server-only";
import { prisma } from "@/lib/prisma";
import type { ArenaQuestion } from "@/types/arena";
import { ARENA_INCLUDE_UNSCHEDULED, ARENA_ROUNDS } from "./config";

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Losuje `ARENA_ROUNDS` id pytań. `today` to klucz dnia UTC (z lib/clock). */
export async function pickQuestionIds(today: string): Promise<string[]> {
  const pool = await prisma.dailyLesson.findMany({
    where: {
      OR: ARENA_INCLUDE_UNSCHEDULED ? [{ dateKey: null }, { dateKey: { lt: today } }] : [{ dateKey: { lt: today } }],
      options: { some: { isOptimal: true } },
    },
    select: { id: true, _count: { select: { options: true } } },
  });
  const usable = pool.filter((q) => q._count.options >= 2).map((q) => q.id);
  return shuffle(usable).slice(0, ARENA_ROUNDS);
}

/** Pytania w podanej kolejności, bez informacji o poprawnej odpowiedzi. `null`, gdy któregoś brakuje. */
export async function loadQuestions(ids: string[], shuffleOptions = false): Promise<ArenaQuestion[] | null> {
  const rows = await prisma.dailyLesson.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      category: true,
      title: true,
      scenario: true,
      options: { select: { id: true, label: true }, orderBy: [{ order: "asc" }, { id: "asc" }] }, // bez isOptimal i feedback
    },
  });
  const byId = new Map(rows.map((r) => [r.id, r]));
  const questions = ids.flatMap((id) => {
    const q = byId.get(id);
    return q ? [{ ...q, options: shuffleOptions ? shuffle(q.options) : q.options }] : [];
  });
  return questions.length === ids.length ? questions : null;
}
