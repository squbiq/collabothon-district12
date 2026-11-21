'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { toDateKey } from '@/lib/daily/mock-data';

export interface DailyLessonDTO {
  id: string;
  dateKey: string;
  category: string;
  title: string;
  scenario: string;
  rewardExp: number;
  options: {
    id: string;
    label: string;
    isOptimal: boolean;
    feedback: string;
  }[];
}

// Zadanie dnia jest wspólne dla wszystkich: gdy na dziś nic nie przypisano, bierzemy
// najstarsze zadanie z puli (dateKey = null) i przypisujemy mu dzisiejszą datę.
async function ensureTodaysLesson(todayKey: string) {
  const existing = await prisma.dailyLesson.findUnique({ where: { dateKey: todayKey }, select: { id: true } });
  if (existing) return;

  const candidate = await prisma.dailyLesson.findFirst({
    where: { dateKey: null },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    select: { id: true },
  });
  if (!candidate) return;

  try {
    await prisma.dailyLesson.updateMany({
      where: { id: candidate.id, dateKey: null },
      data: { dateKey: todayKey },
    });
  } catch {
    // równoległe żądanie przypisało już dzisiejsze zadanie (unikalny dateKey) – nic do zrobienia
  }
}

export async function getDailyLessonsData(userId?: string) {
  const todayKey = toDateKey(new Date());
  await ensureTodaysLesson(todayKey);

  const lessons = await prisma.dailyLesson.findMany({
    where: {
      dateKey: { lte: todayKey },
    },
    include: {
      options: { orderBy: [{ order: 'asc' }, { id: 'asc' }] },
    },
    orderBy: { dateKey: 'desc' },
  });

  const lessonsByDate: Record<string, DailyLessonDTO> = {};
  for (const lesson of lessons) {
    if (lesson.dateKey) lessonsByDate[lesson.dateKey] = { ...lesson, dateKey: lesson.dateKey };
  }

  if (!userId) {
    return {
      lessonsByDate,
      completedDates: [] as string[],
      answersByDate: {} as Record<string, string>,
      streak: 0,
    };
  }

  const [user, progressList] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { streak: true },
    }),
    prisma.userDailyProgress.findMany({
      where: { userId },
      include: {
        dailyLesson: { select: { dateKey: true } },
      },
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

  return {
    lessonsByDate,
    completedDates,
    answersByDate,
    streak: user?.streak ?? 0,
  };
}

export async function submitDailyAnswer(
  userId: string,
  dailyLessonId: string,
  dateKey: string,
  selectedOptionId: string
) {
  const todayKey = toDateKey(new Date());
  const isToday = dateKey === todayKey;

  const [existing, lesson] = await Promise.all([
    prisma.userDailyProgress.findUnique({
      where: {
        userId_dailyLessonId: { userId, dailyLessonId },
      },
    }),
    prisma.dailyLesson.findUnique({
      where: { id: dailyLessonId },
      select: { rewardExp: true },
    }),
  ]);

  await prisma.userDailyProgress.upsert({
    where: {
      userId_dailyLessonId: { userId, dailyLessonId },
    },
    update: { selectedOptionId },
    create: {
      userId,
      dailyLessonId,
      selectedOptionId,
    },
  });

  // Pierwsze ukończenie: dodaj XP (a jeśli to dzisiaj, również podbij streak)
  if (!existing && lesson) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        experience: { increment: lesson.rewardExp },
        ...(isToday
          ? {
              streak: { increment: 1 },
              lastStreakUpdate: new Date(),
            }
          : {}),
      },
    });
  }

  revalidatePath('/daily-lesson');
  return { alreadyCompleted: Boolean(existing) };
}