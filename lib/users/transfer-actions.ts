// lib/users/transfer-actions.ts
//
// Akcje serwerowe: eksport i import użytkowników (tylko admin).
// Sesje nie są eksportowane – po imporcie użytkownicy muszą zalogować się ponownie.
"use server";

import { refresh as refreshRouter, revalidatePath } from "next/cache";
import type { Prisma } from "@/gen/prisma/client";
import { currentTime, utcDateKey } from "@/lib/clock";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { USERS_EXPORT_FORMAT, USERS_EXPORT_VERSION, type UsersExportFile } from "@/types/users-transfer";
import { loadExportedUsers } from "./export-data";
import { parseUsersFile } from "./transfer-parse";
import type { ActionResult } from "./types";

const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });
const MAX_IMPORT_CHARS = 4_500_000;

export async function exportUsers(
  options: { ids?: string[]; includePasswords?: boolean } = {}
): Promise<ActionResult<{ json: string; filename: string; count: number }>> {
  const session = await getSession();
  if (session?.user.role !== "admin") return fail("Forbidden.");

  try {
    const users = await loadExportedUsers({ ids: options.ids, includePasswords: options.includePasswords !== false });
    if (users.length === 0) return fail("There are no users to export.");
    const file: UsersExportFile = { format: USERS_EXPORT_FORMAT, version: USERS_EXPORT_VERSION, users };
    const date = utcDateKey(await currentTime());
    return { ok: true, json: JSON.stringify(file, null, 2), filename: `users-${date}.json`, count: users.length };
  } catch (e) {
    console.error("exportUsers failed", e);
    return fail("Could not export the users.");
  }
}

export async function importUsers(
  text: string,
  options: { overwrite?: boolean } = {}
): Promise<ActionResult<{ created: number; updated: number; skipped: number; droppedProgress: number }>> {
  const session = await getSession();
  if (session?.user.role !== "admin") return fail("Forbidden.");
  if (typeof text !== "string" || text.length > MAX_IMPORT_CHARS) return fail("The file is too large.");

  const parsed = parseUsersFile(text);
  if (!parsed.ok) return fail(parsed.error);
  const overwrite = options.overwrite === true;
  const selfId = session.user.id;

  try {
    const [lessons, dailies] = await Promise.all([
      prisma.lesson.findMany({ select: { id: true } }),
      prisma.dailyLesson.findMany({ select: { id: true } }),
    ]);
    const lessonIds = new Set(lessons.map((l) => l.id));
    const dailyIds = new Set(dailies.map((d) => d.id));

    const counts = await prisma.$transaction(
      async (tx) => {
        let created = 0;
        let updated = 0;
        let skipped = 0;
        let droppedProgress = 0;

        for (const u of parsed.users) {
          const existing = await tx.user.findUnique({ where: { id: u.id }, select: { id: true } });
          // konta, na którym pracuje admin, import nigdy nie nadpisuje (żeby się nie zablokować)
          if (existing && (!overwrite || existing.id === selfId)) {
            skipped++;
            continue;
          }

          // kolizja e-maila/loginu z innym kontem to błąd całego importu (nic nie zostaje zapisane)
          const clash = await tx.user.findFirst({
            where: { id: { not: u.id }, OR: [{ email: u.email }, ...(u.username ? [{ username: u.username }] : [])] },
            select: { email: true },
          });
          if (clash) throw new ImportError(`E-mail or username of ${u.email} is already used by another account.`);

          const data = {
            name: u.name,
            email: u.email,
            emailVerified: u.emailVerified,
            image: u.image,
            username: u.username,
            displayUsername: u.displayUsername,
            role: u.role,
            banned: u.banned,
            banReason: u.banReason,
            banExpires: u.banExpires ? new Date(u.banExpires) : null,
            experience: u.experience,
            streak: u.streak,
            lastStreakUpdate: new Date(u.lastStreakUpdate),
            createdAt: new Date(u.createdAt),
            updatedAt: new Date(u.updatedAt),
          };

          if (existing) {
            await tx.user.update({ where: { id: u.id }, data });
            await tx.account.deleteMany({ where: { userId: u.id } });
            await tx.userLessonProgress.deleteMany({ where: { userId: u.id } });
            await tx.userDailyProgress.deleteMany({ where: { userId: u.id } });
            await tx.arenaDuel.deleteMany({ where: { userId: u.id } });
            await tx.session.deleteMany({ where: { userId: u.id } }); // dane zmieniły się, więc logujemy ponownie
            updated++;
          } else {
            await tx.user.create({ data: { id: u.id, ...data } });
            created++;
          }

          if (u.accounts.length > 0) {
            // id konta musi być unikalne w całej tabeli – obce konto o tym id oznacza kolizję
            const taken = await tx.account.findFirst({ where: { id: { in: u.accounts.map((a) => a.id) } }, select: { id: true } });
            if (taken) throw new ImportError(`An account record of ${u.email} conflicts with an existing one.`);
            await tx.account.createMany({
              data: u.accounts.map((a) => ({
                id: a.id,
                accountId: a.accountId,
                providerId: a.providerId,
                password: a.password ?? null,
                scope: a.scope ?? null,
                userId: u.id,
                createdAt: new Date(a.createdAt),
                updatedAt: new Date(a.updatedAt),
              })),
            });
          }

          const lessonProgress = u.lessonProgress.filter((p) => lessonIds.has(p.lessonId));
          const dailyProgress = u.dailyProgress.filter((p) => dailyIds.has(p.dailyLessonId));
          droppedProgress += u.lessonProgress.length - lessonProgress.length + (u.dailyProgress.length - dailyProgress.length);
          if (lessonProgress.length > 0) {
            await tx.userLessonProgress.createMany({
              data: lessonProgress.map((p) => ({
                userId: u.id,
                lessonId: p.lessonId,
                status: p.status,
                completedAt: p.completedAt ? new Date(p.completedAt) : null,
              })),
            });
          }
          if (dailyProgress.length > 0) {
            await tx.userDailyProgress.createMany({
              data: dailyProgress.map((p) => ({
                userId: u.id,
                dailyLessonId: p.dailyLessonId,
                selectedOptionId: p.selectedOptionId,
                completedAt: new Date(p.completedAt),
              })),
            });
          }

          for (const d of u.arenaDuels) {
            if (await tx.arenaDuel.findUnique({ where: { id: d.id }, select: { id: true } })) continue;
            await tx.arenaDuel.create({
              data: {
                id: d.id,
                userId: u.id,
                status: d.status,
                difficulty: d.difficulty,
                questionIds: (d.questionIds ?? []) as Prisma.InputJsonValue,
                botPlan: (d.botPlan ?? []) as Prisma.InputJsonValue,
                answers: (d.answers ?? []) as Prisma.InputJsonValue,
                answeredCount: d.answeredCount,
                userScore: d.userScore,
                botScore: d.botScore,
                xpAwarded: d.xpAwarded,
                createdAt: new Date(d.createdAt),
                finishedAt: d.finishedAt ? new Date(d.finishedAt) : null,
              },
            });
          }
        }
        return { created, updated, skipped, droppedProgress };
      },
      { timeout: 120_000 }
    );

    revalidatePath("/panel/users");
    refreshRouter();
    return { ok: true, ...counts };
  } catch (e) {
    if (e instanceof ImportError) return fail(`${e.message} Nothing was saved.`);
    console.error("importUsers failed", e);
    return fail("Import failed, nothing was saved. Check the file and try again.");
  }
}

class ImportError extends Error {}
