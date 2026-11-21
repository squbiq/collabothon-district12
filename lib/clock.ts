// lib/clock.ts
//
// Jedyne miejsce w aplikacji, które czyta zegar po stronie serwera.
// Przy cacheComponents odczyt czasu w trakcie prerenderu jest błędem. `await connection()` mówi Next.js,
// że ten fragment dopiero po nadejściu żądania – dzięki temu nie trzeba pamiętać o nim w każdej stronie.
// Doba jest liczona w UTC, tak samo jak streak (components/streak/streak.tsx).
import { connection } from "next/server";

/** Aktualny czas serwera (dynamicznie, po żądaniu). */
export async function currentTime(): Promise<Date> {
  await connection();
  return new Date();
}

/** Klucz dnia "YYYY-MM-DD" w UTC (czysta funkcja). */
export const utcDateKey = (date: Date): string => date.toISOString().slice(0, 10);

export async function todayKey(): Promise<string> {
  return utcDateKey(await currentTime());
}
