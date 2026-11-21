// lib/clock.ts
//
// Jedyne miejsce w aplikacji, które czyta zegar po stronie serwera.
// Przy cacheComponents odczyt czasu w trakcie prerenderu jest błędem, więc wywołuj te funkcje
// dopiero po dostępie do danych żądania (sesja / headers) albo w akcjach serwerowych –
// wtedy nie trzeba dokładać `await connection()`.
// Doba jest liczona w UTC, tak samo jak streak (components/streak/streak.tsx).

export const currentTime = (): Date => new Date();

/** Klucz dnia "YYYY-MM-DD" w UTC. */
export const utcDateKey = (date: Date): string => date.toISOString().slice(0, 10);

export const todayKey = (): string => utcDateKey(currentTime());
