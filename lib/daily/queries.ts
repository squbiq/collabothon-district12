// lib/daily/queries.ts
//
// Odczyty zadań dziennych (tylko serwer). To NIE jest plik "use server", więc nic stąd nie jest
// publicznym endpointem. Zadanie dnia jest wspólne dla wszystkich użytkowników.
import "server-only";
import { prisma } from "@/lib/prisma";
import { todayKey } from "@/lib/clock";
import { getEffectiveStreak } from "@/components/streak/streak";

export interface DailyLessonDTO {
  id: string;
  dateKey: string;
  category: string;
  title: string;
  scenario: string;
  rewardExp: number;
  options: { id: string; label: string; isOptimal: boolean; feedback: string }[];
}

// Gdy na dziś nic nie przypisano, najstarsze zadanie z puli (dateKey = null) dostaje dzisiejszą datę.
async function ensureTodaysLesson(today: string) {
  const existing = await prisma.dailyLesson.findUnique({ where: { dateKey: today }, select: { id: true } });
  if (existing) return;

  const candidate = await prisma.dailyLesson.findFirst({
    where: { dateKey: null },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: { id: true },
  });
  if (!candidate) return;

  try {
    await prisma.dailyLesson.updateMany({ where: { id: candidate.id, dateKey: null }, data: { dateKey: today } });
  } catch {
    // równoległe żądanie przypisało już dzisiejsze zadanie (unikalny dateKey) – nic do zrobienia
  }
}

/** Dane strony zadania dziennego. Wywołuj po odczycie sesji (dane żądania) – zegar jest wtedy dozwolony. */
export async function getDailyLessonsData(userId?: string) {
  const today = todayKey();
  await ensureTodaysLesson(today);

  const lessons = await prisma.dailyLesson.findMany({
    where: { dateKey: { lte: today } },
    include: { options: { orderBy: [{ order: "asc" }, { id: "asc" }] } },
    orderBy: { dateKey: "desc" },
  });

  const lessonsByDate: Record<string, DailyLessonDTO> = {};
  for (const lesson of lessons) {
    if (lesson.dateKey) lessonsByDate[lesson.dateKey] = { ...lesson, dateKey: lesson.dateKey };
  }

  const empty = { today, lessonsByDate, completedDates: [] as string[], answersByDate: {} as Record<string, string>, streak: 0 };
  if (!userId) return empty;

  const [user, progressList] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { streak: true, lastStreakUpdate: true } }),
    prisma.userDailyProgress.findMany({
      where: { userId },
      include: { dailyLesson: { select: { dateKey: true } } },
    }),
  ]);

  const completedDates: string[] = [];
  const answersByDate: Record<string, string> = {};
  for (const item of progressList) {
    const key = item.dailyLesson.dateKey;
    if (!key) continue;
    completedDates.push(key);
    answersByDate[key] = item.selectedOptionId;
  }

  return { ...empty, completedDates, answersByDate, streak: user ? getEffectiveStreak(user) : 0 };
}

/** Dzisiejsza misja dla strony głównej: krótkie dane i informacja, czy użytkownik już ją zrobił. */
export async function getTodayMission(userId?: string) {
  const today = todayKey();
  await ensureTodaysLesson(today);

  const lesson = await prisma.dailyLesson.findUnique({
    where: { dateKey: today },
    select: { id: true, title: true, category: true, rewardExp: true },
  });
  if (!lesson) return { today, lesson: null, completed: false };

  const progress = userId
    ? await prisma.userDailyProgress.findUnique({
        where: { userId_dailyLessonId: { userId, dailyLessonId: lesson.id } },
        select: { id: true },
      })
    : null;
  return { today, lesson, completed: progress !== null };
}
