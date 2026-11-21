// lib/arena/config.ts
//
// Ustawienia areny w jednym miejscu. Plik bez "use server", więc importuje go też klient.

/** Ile pytań w jednym pojedynku/meczu (gdy w bazie jest mniej pytań, gra się mniej rund). */
export const ARENA_ROUNDS = 5;

/**
 * Czy do puli areny wchodzą też zadania dzienne bez przypisanej daty (jeszcze nie wylosowane na żaden dzień).
 * Przy `false` arena używa tylko zadań archiwalnych (starszych niż dzisiejsze) – bezpieczniej dla dziennej misji,
 * ale na początku pytań jest mało.
 */
export const ARENA_INCLUDE_UNSCHEDULED = true;

// ---------- Walka z botem ----------

export const BOT_DIFFICULTIES = {
  easy: { label: "Easy", description: "A rookie: gets about 4 in 10 right.", accuracy: 0.4, xpMultiplier: 1 },
  medium: { label: "Medium", description: "Solid knowledge: gets about 7 in 10 right.", accuracy: 0.7, xpMultiplier: 1.5 },
  hard: { label: "Hard", description: "A market veteran: gets about 9 in 10 right.", accuracy: 0.9, xpMultiplier: 2 },
} as const;

export type BotDifficulty = keyof typeof BOT_DIFFICULTIES;
export const BOT_DIFFICULTY_KEYS = Object.keys(BOT_DIFFICULTIES) as BotDifficulty[];
export const isBotDifficulty = (value: unknown): value is BotDifficulty =>
  typeof value === "string" && value in BOT_DIFFICULTIES;

/** Bazowe XP za wynik pojedynku z botem (mnożone przez `xpMultiplier` trudności). */
export const XP_REWARDS = {
  win: 15,
  draw: 10,
  loss: 5,
} as const;

// ---------- Gra online ----------

/** XP za mecz online. */
export const ONLINE_XP_REWARDS = {
  win: 30,
  draw: 18,
  loss: 8,
} as const;

/** Czas na jedno pytanie. */
export const ONLINE_QUESTION_SECONDS = 20;
/** Pauza na przeczytanie wyniku, zanim zacznie się następne pytanie (zegar pytania nie biegnie w tym czasie). */
export const ONLINE_REVEAL_SECONDS = 4;
/** Odliczanie przed pierwszym pytaniem, gdy znajdzie się rywal. */
export const ONLINE_START_COUNTDOWN_SECONDS = 3;
/** Punkty za poprawną odpowiedź + maksymalny bonus za szybkość (malejący liniowo do 0 po upływie czasu). */
export const ONLINE_CORRECT_POINTS = 100;
export const ONLINE_SPEED_BONUS_MAX = 50;
/** Jak długo szukamy rywala, zanim zaproponujemy walkę z botem. */
export const ONLINE_SEARCH_TIMEOUT_SECONDS = 60;
/** Po tylu sekundach bez odpowiedzi gracz oddaje mecz walkowerem. */
export const ONLINE_IDLE_FORFEIT_SECONDS = 45;
/** Co ile ms klient odpytuje serwer o stan meczu. */
export const ONLINE_POLL_MS = 1500;
