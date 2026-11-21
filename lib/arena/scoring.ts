// lib/arena/scoring.ts
//
// Czyste funkcje punktacji (bez dostępu do bazy i zegara).
import type { DuelOutcome } from "@/types/arena";
import { ONLINE_CORRECT_POINTS, ONLINE_QUESTION_SECONDS, ONLINE_SPEED_BONUS_MAX } from "./config";

export function outcomeOf(mine: number, theirs: number): DuelOutcome {
  if (mine > theirs) return "win";
  if (mine < theirs) return "loss";
  return "draw";
}

/** Poprawna odpowiedź = 100 pkt + do 50 pkt za szybkość; błędna lub po czasie = 0. */
export function answerPoints(correct: boolean, responseMs: number): number {
  if (!correct) return 0;
  const left = Math.max(0, 1 - responseMs / (ONLINE_QUESTION_SECONDS * 1000));
  return ONLINE_CORRECT_POINTS + Math.round(ONLINE_SPEED_BONUS_MAX * left);
}
