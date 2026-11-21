// lib/users/export-data.ts
//
// Wspólne budowanie eksportu danych użytkownika (admin: wielu użytkowników, profil: jeden).
// Sesje nigdy nie są eksportowane. Tokeny kont zewnętrznych też nie.
import { prisma } from "@/lib/prisma";
import type { ExportedUser } from "@/types/users-transfer";

const iso = (d: Date) => d.toISOString();

export async function loadExportedUsers(opts: { ids?: string[]; includePasswords: boolean }): Promise<ExportedUser[]> {
  const rows = await prisma.user.findMany({
    where: opts.ids ? { id: { in: opts.ids } } : undefined,
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    include: {
      accounts: { orderBy: { createdAt: "asc" } },
      userLessonProgress: true,
      userDailyProgress: true,
      arenaDuels: { orderBy: { createdAt: "asc" } },
    },
  });

  return rows.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    emailVerified: u.emailVerified,
    image: u.image,
    username: u.username,
    displayUsername: u.displayUsername,
    role: u.role,
    banned: u.banned,
    banReason: u.banReason,
    banExpires: u.banExpires ? iso(u.banExpires) : null,
    experience: u.experience,
    streak: u.streak,
    lastStreakUpdate: iso(u.lastStreakUpdate),
    createdAt: iso(u.createdAt),
    updatedAt: iso(u.updatedAt),
    accounts: u.accounts.map((a) => ({
      id: a.id,
      accountId: a.accountId,
      providerId: a.providerId,
      ...(opts.includePasswords ? { password: a.password } : {}),
      scope: a.scope,
      createdAt: iso(a.createdAt),
      updatedAt: iso(a.updatedAt),
    })),
    lessonProgress: u.userLessonProgress.map((p) => ({
      lessonId: p.lessonId,
      status: p.status,
      completedAt: p.completedAt ? iso(p.completedAt) : null,
    })),
    dailyProgress: u.userDailyProgress.map((p) => ({
      dailyLessonId: p.dailyLessonId,
      selectedOptionId: p.selectedOptionId,
      completedAt: iso(p.completedAt),
    })),
    arenaDuels: u.arenaDuels.map((d) => ({
      id: d.id,
      status: d.status,
      difficulty: d.difficulty,
      questionIds: d.questionIds,
      botPlan: d.botPlan,
      answers: d.answers,
      answeredCount: d.answeredCount,
      userScore: d.userScore,
      botScore: d.botScore,
      xpAwarded: d.xpAwarded,
      createdAt: iso(d.createdAt),
      finishedAt: d.finishedAt ? iso(d.finishedAt) : null,
    })),
  }));
}
