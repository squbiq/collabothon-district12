// types/arena.ts

import type { BotDifficulty } from "@/lib/arena/config";

export type ArenaOption = { id: string; label: string };

// Pytanie widoczne w przeglądarce: celowo bez informacji, która opcja jest poprawna.
export type ArenaQuestion = {
  id: string;
  category: string;
  title: string;
  scenario: string;
  options: ArenaOption[];
};

export type DuelOutcome = "win" | "draw" | "loss";

export type StartDuelResult =
  | { ok: true; duelId: string; questions: ArenaQuestion[] }
  | { ok: false; error: string };

export type AnswerResult =
  | { ok: false; error: string }
  | {
      ok: true;
      correct: boolean;
      correctOptionId: string;
      feedback: string;
      botCorrect: boolean;
      userScore: number;
      botScore: number;
      finished: boolean;
      // tylko po ostatnim pytaniu
      outcome?: DuelOutcome;
      xp?: number;
    };

export type { BotDifficulty };

// ---------- Gra online ----------

/** Widok gracza w meczu online. Wyniki rywala widać tylko dla pytań, na które sam już odpowiedziałeś. */
export type MatchPlayerView = {
  name: string;
  /** Na ile pytań gracz już odpowiedział. */
  answered: number;
  points: number;
  /** true/false = poprawna/błędna odpowiedź, null = rywal odpowiedział, ale wynik jest jeszcze ukryty. */
  results: (boolean | null)[];
};

export type MatchResult = {
  outcome: DuelOutcome;
  myPoints: number;
  opponentPoints: number;
  xp: number;
  /** Ktoś przestał odpowiadać i oddał mecz walkowerem. */
  forfeit: "me" | "opponent" | null;
};

export type MatchState =
  | { ok: false; error: string }
  // waiting: szukamy rywala; expired/cancelled: wyszukiwanie zakończone bez meczu
  | { ok: true; status: "waiting" | "expired" | "cancelled"; matchId: string }
  | {
      ok: true;
      status: "in_progress" | "finished";
      matchId: string;
      /** Pytania są wysyłane tylko wtedy, gdy klient o nie poprosi (pierwsze zapytanie). */
      questions?: ArenaQuestion[];
      total: number;
      /** Za ile ms zaczyna się Twoje bieżące pytanie (ujemne = już trwa). */
      currentStartsInMs: number;
      me: MatchPlayerView;
      opponent: MatchPlayerView;
      result?: MatchResult;
    };

export type FindMatchResult = { ok: true; matchId: string } | { ok: false; error: string };

export type MatchAnswerResult =
  | { ok: false; error: string }
  | {
      ok: true;
      position: number;
      correct: boolean;
      timedOut: boolean;
      correctOptionId: string;
      feedback: string;
      points: number;
      responseMs: number;
      /** Za ile ms zaczyna się następne pytanie; null po ostatnim. */
      nextStartsInMs: number | null;
    };
