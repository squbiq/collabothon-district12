// lib/daily/actions.ts
//
// Akcja serwerowa zadania dziennego: pierwsze kliknięcie odpowiedzi oznacza zadanie jako ukończone,
// daje XP zdefiniowane w zadaniu oraz (dla zadania z dzisiaj) +1 do streaka.
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { currentTime, todayKey } from '@/lib/clock';
import { getEffectiveStreak, registerStreakActivity } from '@/components/streak/streak';

export type CompleteDailyResult =
  | { ok: true; firstCompletion: boolean; xpGained: number; streak: number; isCorrect: boolean }
  | { ok: false; error: string };

export async function completeDaily(dailyLessonId: string, selectedOptionId: string): Promise<CompleteDailyResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'Sign in to save your progress.' };
  const userId = session.user.id;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const now = currentTime();
      const lesson = await tx.dailyLesson.findUnique({
        where: { id: dailyLessonId },
        select: { dateKey: true, rewardExp: true, options: { select: { id: true, isOptimal: true } } },
      });
      if (!lesson) throw new Error('Task not found.');
      // zadania z puli (bez daty) i z przyszłości nie są jeszcze dostępne
      if (!lesson.dateKey || lesson.dateKey > todayKey()) throw new Error('This task is not available yet.');
      const option = lesson.options.find((o) => o.id === selectedOptionId);
      if (!option) throw new Error('Unknown answer.');

      // Klucz (userId, dailyLessonId) jest unikalny – tylko jedno z równoległych kliknięć dostaje nagrodę.
      const created = await tx.userDailyProgress.createMany({
        data: [{ userId, dailyLessonId, selectedOptionId }],
        skipDuplicates: true,
      });
      const firstCompletion = created.count === 1;

      let xpGained = 0;
      let streak: number;
      if (firstCompletion) {
        xpGained = lesson.rewardExp;
        if (xpGained > 0) await tx.user.update({ where: { id: userId }, data: { experience: { increment: xpGained } } });
        // streak tylko za dzisiejsze zadanie (archiwum daje XP, ale nie podbija serii)
        streak =
          lesson.dateKey === todayKey()
            ? (await registerStreakActivity(tx, userId, now)).streak
            : await currentStreak(tx, userId, now);
      } else {
        streak = await currentStreak(tx, userId, now);
      }
      return { firstCompletion, xpGained, streak, isCorrect: option.isOptimal };
    });

    revalidatePath('/daily-lesson');
    revalidatePath('/');
    return { ok: true, ...result };
  } catch (e) {
    console.error('completeDaily failed', e);
    return { ok: false, error: e instanceof Error ? e.message : 'Could not save your answer.' };
  }
}

async function currentStreak(db: Pick<typeof prisma, 'user'>, userId: string, now: Date) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { streak: true, lastStreakUpdate: true } });
  return user ? getEffectiveStreak(user, now) : 0;
}
