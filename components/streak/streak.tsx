import type { PrismaClient } from "@/gen/prisma/client";

/**
 * Liczenie streaka oparte o pola User.streak i User.lastStreakUpdate.
 * Dzień = dzień kalendarzowy UTC (zgodnie z bazą).
 *
 * Zasady:
 *  - pierwsza aktywność danego dnia (daily LUB lekcja ze ścieżki) daje +1,
 *  - kolejne aktywności tego samego dnia nic nie zmieniają,
 *  - aktywność dzień po poprzedniej kontynuuje serię,
 *  - przerwa dłuższa niż 1 dzień resetuje serię do 1,
 *  - brak zamrażania i brak rekordu streaka.
 */

const DAY_MS = 86_400_000;

export type StreakState = {
  streak: number;
  lastStreakUpdate: Date;
};

/** Numer dnia UTC od epoki Unix (granica dnia o 00:00 UTC). */
export function utcDayIndex(date: Date): number {
  return Math.floor(date.getTime() / DAY_MS);
}

/**
 * Czysta funkcja: jaki będzie streak po aktywności w chwili `now`.
 * Uwaga: lastStreakUpdate ma w schemacie @default(now()), więc nowy użytkownik
 * ma streak = 0 i datę z dzisiaj – dlatego streak === 0 zawsze daje 1.
 */
export function computeStreakAfterActivity(
  state: StreakState,
  now: Date,
): { streak: number; changed: boolean } {
  const today = utcDayIndex(now);
  const last = utcDayIndex(state.lastStreakUpdate);

  if (state.streak === 0) {
    return { streak: 1, changed: true };
  }
  // ">=" odporne na lekkie przesunięcia zegara
  if (last >= today) {
    return { streak: state.streak, changed: false };
  }
  if (last === today - 1) {
    return { streak: state.streak + 1, changed: true };
  }
  return { streak: 1, changed: true };
}

/**
 * Streak do wyświetlenia. Nie ma crona resetującego serie, więc jeśli
 * użytkownik opuścił cały dzień, w bazie nadal siedzi stara wartość –
 * tutaj traktujemy ją jako 0. Używaj do odczytu (profil, strona główna).
 */
export function getEffectiveStreak(
  state: StreakState,
  now: Date,
): number {
  if (state.streak === 0) return 0;
  const today = utcDayIndex(now);
  const last = utcDayIndex(state.lastStreakUpdate);
  return last >= today - 1 ? state.streak : 0;
}

/** Czy streak jest już zaliczony na dziś (np. do UI „zrób lekcję, by utrzymać serię”). */
export function isStreakDoneToday(
  state: StreakState,
  now: Date,
): boolean {
  return (
    state.streak > 0 && utcDayIndex(state.lastStreakUpdate) >= utcDayIndex(now)
  );
}

type Db = Pick<PrismaClient, "user">;

/**
 * Wywołaj po ukończeniu lekcji daily lub lekcji ze ścieżki tematycznej.
 * Można przekazać PrismaClient albo klienta z transakcji ($transaction).
 *
 * Zapis jest warunkowy (compare-and-set po streak + lastStreakUpdate), więc
 * dwa równoległe ukończenia tego samego dnia nie policzą +1 dwa razy.
 */
export async function registerStreakActivity(
  db: Db,
  userId: string,
  now: Date,
): Promise<{ streak: number; changed: boolean }> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { streak: true, lastStreakUpdate: true },
    });
    if (!user) throw new Error(`Użytkownik ${userId} nie istnieje`);

    const next = computeStreakAfterActivity(user, now);
    if (!next.changed) return next;

    const { count } = await db.user.updateMany({
      where: {
        id: userId,
        streak: user.streak,
        lastStreakUpdate: user.lastStreakUpdate,
      },
      data: { streak: next.streak, lastStreakUpdate: now },
    });
    if (count === 1) return next;
    // ktoś zmienił rekord w międzyczasie – czytamy ponownie
  }

  const fresh = await db.user.findUnique({
    where: { id: userId },
    select: { streak: true, lastStreakUpdate: true },
  });
  return { streak: fresh?.streak ?? 0, changed: false };
}