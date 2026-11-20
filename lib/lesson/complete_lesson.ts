"use server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { registerStreakActivity } from "@/components/streak/streak";

export type CompleteLessonResult = {
  firstCompletion: boolean;
  experienceGained: number;
  streak: number;
};

export async function completeLesson(
  lessonId: string,
): Promise<CompleteLessonResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  const userId = session.user.id;

  return prisma.$transaction(async (tx) => {
    const now = new Date();

    const lesson = await tx.lesson.findUnique({
      where: { id: lessonId },
      select: { experience: true },
    });
    if (!lesson) throw new Error("Lesson not found");

    // Wiersz (userId, lessonId) w UserLessonProgress = lekcja ukończona.
    // Klucz główny gwarantuje, że tylko jedno z równoległych wywołań
    // utworzy wiersz (count === 1) – tylko ono dostaje XP.
    const created = await tx.userLessonProgress.createMany({
      data: [{ userId, lessonId, status: "completed", completedAt: now }],
      skipDuplicates: true,
    });
    const firstCompletion = created.count === 1;

    let experienceGained = 0;
    if (firstCompletion && lesson.experience > 0) {
      experienceGained = lesson.experience;
      await tx.user.update({
        where: { id: userId },
        data: { experience: { increment: experienceGained } },
      });
    }

    // Streak liczy się za każdą aktywność (także powtórkę), +1 max raz dziennie (UTC)
    const { streak } = await registerStreakActivity(tx, userId, now);

    return { firstCompletion, experienceGained, streak };
  });
}