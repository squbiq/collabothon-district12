// Akcje serwerowe panelu admina: pula zadań dziennych (jedna poprawna odpowiedź + błędne).
// Każda akcja sama sprawdza rolę admina – akcje są publicznymi endpointami.
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import type { DailyTaskInput } from "./admin-types";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });
const clean = (v: unknown) => (typeof v === "string" ? v.trim() : "");

async function isAdmin() {
  const session = await getSession();
  return session?.user.role === "admin";
}

function refresh() {
  revalidatePath("/panel/daily-lesson", "layout");
  revalidatePath("/daily-lesson");
}

function parseTask(input: DailyTaskInput) {
  const category = clean(input.category);
  const title = clean(input.title);
  const scenario = clean(input.scenario);
  const rewardExp = Number(input.rewardExp);

  if (!category || !title || !scenario) return fail("Fill in the category, title and scenario.");
  if (category.length > 191 || title.length > 191) return fail("Category and title are too long (max 191 characters).");
  if (!Number.isInteger(rewardExp) || rewardExp < 0 || rewardExp > 1_000_000) {
    return fail("Reward must be a whole number (0 or more).");
  }

  const options = (Array.isArray(input.options) ? input.options : []).map((o) => ({
    id: clean(o?.id) || undefined,
    label: clean(o?.label),
    isOptimal: o?.isOptimal === true,
    feedback: clean(o?.feedback),
  }));
  if (options.length < 2) return fail("Add at least 2 options.");
  if (options.some((o) => !o.label || !o.feedback)) return fail("Every option needs a label and feedback.");
  if (options.some((o) => o.label.length > 191)) return fail("An option label is too long (max 191 characters).");
  if (options.filter((o) => o.isOptimal).length !== 1) return fail("Exactly one option must be correct.");

  return { ok: true as const, data: { category, title, scenario, rewardExp, options } };
}

export async function createDailyTask(input: DailyTaskInput): Promise<Result<{ id: string }>> {
  if (!(await isAdmin())) return fail("Forbidden.");
  const parsed = parseTask(input);
  if (!parsed.ok) return parsed;
  const { options, ...data } = parsed.data;

  try {
    const task = await prisma.dailyLesson.create({
      data: {
        ...data,
        options: {
          create: options.map(({ label, isOptimal, feedback }, order) => ({ order, label, isOptimal, feedback })),
        },
      },
      select: { id: true },
    });
    refresh();
    return { ok: true, id: task.id };
  } catch (e) {
    console.error("createDailyTask failed", e);
    return fail("Could not save the task. Try again.");
  }
}

// Opcje z istniejącym id są aktualizowane (odpowiedzi użytkowników wskazują na ich id),
// brakujące w formularzu są usuwane, nowe – tworzone.
export async function updateDailyTask(id: string, input: DailyTaskInput): Promise<Result> {
  if (!(await isAdmin())) return fail("Forbidden.");
  const parsed = parseTask(input);
  if (!parsed.ok) return parsed;
  const { options, ...data } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.dailyOption.findMany({ where: { dailyLessonId: id }, select: { id: true } });
      const existingIds = new Set(existing.map((o) => o.id));
      const keepIds = new Set(options.flatMap((o) => (o.id && existingIds.has(o.id) ? [o.id] : [])));

      await tx.dailyOption.deleteMany({
        where: { dailyLessonId: id, id: { notIn: [...keepIds] } },
      });
      await tx.dailyLesson.update({ where: { id }, data });

      for (const [order, o] of options.entries()) {
        const fields = { order, label: o.label, isOptimal: o.isOptimal, feedback: o.feedback };
        if (o.id && keepIds.has(o.id)) await tx.dailyOption.update({ where: { id: o.id }, data: fields });
        else await tx.dailyOption.create({ data: { ...fields, dailyLessonId: id } });
      }
    });
    refresh();
    return { ok: true };
  } catch (e) {
    console.error("updateDailyTask failed", e);
    return fail("Could not save the task. Try again.");
  }
}

export async function deleteDailyTask(id: string): Promise<Result> {
  if (!(await isAdmin())) return fail("Forbidden.");
  try {
    // opcje i postępy użytkowników usuwają się kaskadowo
    await prisma.dailyLesson.delete({ where: { id } });
    refresh();
    return { ok: true };
  } catch (e) {
    console.error("deleteDailyTask failed", e);
    return fail("Could not delete the task.");
  }
}
