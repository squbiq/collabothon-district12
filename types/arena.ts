// types/arena.ts

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