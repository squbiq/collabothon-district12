// lib/daily/transfer-actions.ts
//
// Akcje serwerowe: eksport i import zadań dziennych w formacie JSON (tylko admin).
"use server";

import { refresh as refreshRouter, revalidatePath } from "next/cache";
import { currentTime, utcDateKey } from "@/lib/clock";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { DAILY_EXPORT_FORMAT, DAILY_EXPORT_VERSION, type DailyExportFile } from "@/types/daily-transfer";
import { parseDailyFile } from "./transfer-parse";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });
const MAX_IMPORT_CHARS = 4_500_000;

async function isAdmin() {
  const session = await getSession();
  return session?.user.role === "admin";
}

export async function exportDailyTasks(
  options: { ids?: string[]; stripIds?: boolean } = {}
): Promise<Result<{ json: string; filename: string; count: number }>> {
  if (!(await isAdmin())) return fail("Forbidden.");

  try {
    const rows = await prisma.dailyLesson.findMany({
      where: options.ids ? { id: { in: options.ids } } : undefined,
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      include: { options: { orderBy: [{ order: "asc" }, { id: "asc" }] } },
    });
    if (rows.length === 0) return fail("There are no tasks to export.");

    const file: DailyExportFile = {
      format: DAILY_EXPORT_FORMAT,
      version: DAILY_EXPORT_VERSION,
      tasks: rows.map((row) => ({
        ...(options.stripIds ? {} : { id: row.id }),
        category: row.category,
        title: row.title,
        scenario: row.scenario,
        rewardExp: row.rewardExp,
        // Data przypisania nie jest eksportowana: importowane zadania trafiają do puli.
        options: row.options.map((o) => ({ label: o.label, isOptimal: o.isOptimal, feedback: o.feedback })),
      })),
    };
    const date = utcDateKey(await currentTime());
    return { ok: true, json: JSON.stringify(file, null, 2), filename: `daily-tasks-${date}.json`, count: rows.length };
  } catch (e) {
    console.error("exportDailyTasks failed", e);
    return fail("Could not export the tasks.");
  }
}

export async function importDailyTasks(
  text: string,
  options: { ignoreIds?: boolean } = {}
): Promise<Result<{ created: number; updated: number }>> {
  if (!(await isAdmin())) return fail("Forbidden.");
  if (typeof text !== "string" || text.length > MAX_IMPORT_CHARS) return fail("The file is too large.");

  const parsed = parseDailyFile(text);
  if (!parsed.ok) return fail(parsed.error);
  const useIds = options.ignoreIds !== true;

  try {
    // Jedna transakcja: albo importujemy cały plik, albo nic.
    const counts = await prisma.$transaction(
      async (tx) => {
        let created = 0;
        let updated = 0;

        for (const task of parsed.tasks) {
          const { options: opts, id, ...fields } = task;
          const existing = useIds && id ? await tx.dailyLesson.findUnique({ where: { id }, select: { id: true } }) : null;

          if (existing) {
            // Opcje aktualizujemy pozycja po pozycji, żeby zachować id, na które wskazują odpowiedzi użytkowników.
            const current = await tx.dailyOption.findMany({
              where: { dailyLessonId: existing.id },
              orderBy: [{ order: "asc" }, { id: "asc" }],
              select: { id: true },
            });
            await tx.dailyLesson.update({ where: { id: existing.id }, data: fields });
            for (const [order, o] of opts.entries()) {
              const data = { order, label: o.label, isOptimal: o.isOptimal, feedback: o.feedback };
              const match = current[order];
              if (match) await tx.dailyOption.update({ where: { id: match.id }, data });
              else await tx.dailyOption.create({ data: { ...data, dailyLessonId: existing.id } });
            }
            const surplus = current.slice(opts.length).map((o) => o.id);
            if (surplus.length > 0) await tx.dailyOption.deleteMany({ where: { id: { in: surplus } } });
            updated++;
          } else {
            await tx.dailyLesson.create({
              data: {
                ...(useIds && id ? { id } : {}),
                ...fields,
                options: { create: opts.map((o, order) => ({ order, label: o.label, isOptimal: o.isOptimal, feedback: o.feedback })) },
              },
            });
            created++;
          }
        }
        return { created, updated };
      },
      { timeout: 60_000 }
    );

    revalidatePath("/panel/daily-lesson", "layout");
    revalidatePath("/daily-lesson");
    refreshRouter();
    return { ok: true, ...counts };
  } catch (e) {
    console.error("importDailyTasks failed", e);
    return fail("Import failed, nothing was saved. Check the file and try again.");
  }
}
