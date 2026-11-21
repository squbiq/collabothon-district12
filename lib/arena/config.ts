// lib/arena/config.ts
//
// Ustawienia areny w jednym miejscu. Plik bez "use server", więc importuje go też klient.

/** Ile pytań w jednym pojedynku (gdy w bazie jest mniej pytań, gra się mniej rund). */
export const ARENA_ROUNDS = 5;

/** Szansa, że bot odpowie poprawnie na pytanie (0-1). */
export const BOT_ACCURACY = 0.7;

/** XP za wynik pojedynku. */
export const XP_REWARDS = {
  win: 15,
  draw: 10,
  loss: 5,
} as const;