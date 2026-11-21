// Odczyty panelu admina dla zadań dziennych (nie "use server" – nie są publicznymi akcjami).
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import type { DailyTaskForEdit, DailyTaskListItem } from "./admin-types";

export async function getDailyPool(): Promise<DailyTaskListItem[]> {
  await requireAdmin();
  const rows = await prisma.dailyLesson.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    select: {
      id: true,
      title: true,
      category: true,
      rewardExp: true,
      dateKey: true,
      _count: { select: { options: true, progress: true } },
    },
  });
  return rows.map(({ _count, ...r }) => ({ ...r, optionCount: _count.options, answers: _count.progress }));
}

export async function getDailyTaskForEdit(id: string): Promise<DailyTaskForEdit | null> {
  await requireAdmin();
  const row = await prisma.dailyLesson.findUnique({
    where: { id },
    include: {
      options: { orderBy: [{ order: "asc" }, { id: "asc" }] },
      _count: { select: { progress: true } },
    },
  });
  if (!row) return null;
  return {
    id: row.id,
    dateKey: row.dateKey,
    category: row.category,
    title: row.title,
    scenario: row.scenario,
    rewardExp: row.rewardExp,
    answers: row._count.progress,
    options: row.options.map((o) => ({ id: o.id, label: o.label, isOptimal: o.isOptimal, feedback: o.feedback })),
  };
}
