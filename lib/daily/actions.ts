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

export async function getDailyLessonsData(userId?: string) {
  const todayKey = toDateKey(new Date());

  const lessons = await prisma.dailyLesson.findMany({
    where: {
      dateKey: { lte: todayKey },
    },
    include: {
      options: true,
    },
    orderBy: { dateKey: 'desc' },
  });

  const lessonsByDate: Record<string, DailyLessonDTO> = {};
  for (const lesson of lessons) {
    lessonsByDate[lesson.dateKey] = lesson;
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