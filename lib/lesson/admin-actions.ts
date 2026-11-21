// lib/lesson/admin-actions.ts
//
// Akcje serwerowe panelu admina: lekcje i ich etapy (stage'e).
// Każda akcja sama sprawdza rolę admina – akcje są publicznymi endpointami.
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { PERSONAS, type LessonDataInput, type StepInput } from "@/types/lesson-input";
import { defaultStage } from "./default-stage";
import { isEditableStepType, parseStep, stepColumns } from "./step-parser";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });
const clean = (v: unknown) => (typeof v === "string" ? v.trim() : "");

async function isAdmin() {
  const session = await getSession();
  return session?.user.role === "admin";
}

// Odświeża menu w panelu oraz mapę lekcji.
function refresh() {
  revalidatePath("/panel/lesson", "layout");
  revalidatePath("/lesson-map");
}

async function parseLessonData(input: LessonDataInput) {
  const chapterId = clean(input.chapterId);
  const title = clean(input.title);
  const description = clean(input.description);
  const estimatedMinutes = Number(input.estimatedMinutes);
  const experience = Number(input.experience);
  const unlockAssetId = clean(input.unlockAssetId);

  if (!chapterId || !title || !description) return fail("Fill in the chapter, title and description.");
  if (!Number.isInteger(estimatedMinutes) || estimatedMinutes < 1) {
    return fail("Estimated time must be a whole number (at least 1 minute).");
  }
  // kolumna experience jest UNSIGNED INT, a tytuł i zasób to VARCHAR(191)
  if (!Number.isInteger(experience) || experience < 0 || experience > 1_000_000) {
    return fail("Experience must be a whole number (0 or more).");
  }
  if (title.length > 191 || unlockAssetId.length > 191) return fail("Title is too long (max 191 characters).");
  const chapter = await prisma.chapter.findUnique({ where: { id: chapterId }, select: { id: true } });
  if (!chapter) return fail("Selected chapter does not exist.");

  const order =
    Number.isInteger(input.order) && (input.order as number) >= 0 ? (input.order as number) : null;

  return {
    ok: true as const,
    data: {
      order,
      chapterId,
      title,
      description,
      estimatedMinutes,
      experience,
      unlockAssetId: unlockAssetId || null,
      personas: [...new Set((input.targetPersonas ?? []).filter((p) => PERSONAS.includes(p)))],
    },
  };
}

// ---------- Lekcje ----------

// Tworzy lekcję z jednym domyślnym stage'em (story), żeby od razu pojawiła się w menu.
export async function createLessonWithStage(input: LessonDataInput): Promise<Result<{ id: string }>> {
  if (!(await isAdmin())) return fail("Forbidden.");
  const parsed = await parseLessonData(input);
  if (!parsed.ok) return parsed;
  const { order, personas, ...data } = parsed.data;

  const first = parseStep(defaultStage("story"));
  if (!first.ok) return first;

  try {
    const lastOrder = (await prisma.lesson.aggregate({ _max: { order: true } }))._max.order ?? 0;
    const lesson = await prisma.lesson.create({
      data: {
        ...data,
        order: order ?? lastOrder + 1,
        targetPersonas: { create: personas.map((persona) => ({ persona })) },
        steps: {
          create: [{ order: 1, ...stepColumns(first.step) }],
        },
      },
      select: { id: true },
    });
    refresh();
    return { ok: true, id: lesson.id };
  } catch (e) {
    console.error("createLessonWithStage failed", e);
    return fail("Could not save the lesson. Try again.");
  }
}

export async function saveLessonData(id: string, input: LessonDataInput): Promise<Result> {
  if (!(await isAdmin())) return fail("Forbidden.");
  const parsed = await parseLessonData(input);
  if (!parsed.ok) return parsed;
  const { order, personas, ...data } = parsed.data;

  try {
    await prisma.$transaction([
      prisma.lessonPersona.deleteMany({ where: { lessonId: id } }),
      prisma.lesson.update({
        where: { id },
        data: {
          ...data,
          // puste pole "order" = zostaw dotychczasową pozycję
          ...(order !== null ? { order } : {}),
          targetPersonas: { create: personas.map((persona) => ({ persona })) },
        },
      }),
    ]);
    refresh();
    return { ok: true };
  } catch (e) {
    console.error("saveLessonData failed", e);
    return fail("Could not save the lesson. Try again.");
  }
}

export async function deleteLesson(id: string): Promise<Result> {
  if (!(await isAdmin())) return fail("Forbidden.");
  try {
    // kroki, opcje, persony i postępy usuwają się kaskadowo
    await prisma.lesson.delete({ where: { id } });
    refresh();
    return { ok: true };
  } catch (e) {
    console.error("deleteLesson failed", e);
    return fail("Could not delete the lesson.");
  }
}

// ---------- Etapy (stage'e) ----------

export async function createStage(
  lessonId: string,
  type: StepInput["type"]
): Promise<Result<{ id: string }>> {
  if (!(await isAdmin())) return fail("Forbidden.");
  // typ przychodzi z klienta – nieznany nie może dojść do defaultStage()
  if (!isEditableStepType(type)) return fail("Unknown stage type.");
  const parsed = parseStep(defaultStage(type));
  if (!parsed.ok) return parsed;

  try {
    const last = await prisma.lessonStep.aggregate({ where: { lessonId }, _max: { order: true } });
    const stage = await prisma.lessonStep.create({
      data: {
        lessonId,
        order: (last._max.order ?? 0) + 1,
        ...stepColumns(parsed.step),
      },
      select: { id: true },
    });
    refresh();
    return { ok: true, id: stage.id };
  } catch (e) {
    console.error("createStage failed", e);
    return fail("Could not add the stage.");
  }
}

export async function updateStage(
  lessonId: string,
  stageId: string,
  input: StepInput
): Promise<Result> {
  if (!(await isAdmin())) return fail("Forbidden.");
  const parsed = parseStep(input);
  if (!parsed.ok) return parsed;

  try {
    const existing = await prisma.lessonStep.findFirst({ where: { id: stageId, lessonId }, select: { id: true } });
    if (!existing) return fail("Stage not found.");

    await prisma.lessonStep.update({ where: { id: stageId }, data: stepColumns(parsed.step) });
    refresh();
    return { ok: true };
  } catch (e) {
    console.error("updateStage failed", e);
    return fail("Could not save the stage.");
  }
}

export async function deleteStage(lessonId: string, stageId: string): Promise<Result> {
  if (!(await isAdmin())) return fail("Forbidden.");
  try {
    await prisma.$transaction(async (tx) => {
      const stage = await tx.lessonStep.findFirst({ where: { id: stageId, lessonId }, select: { order: true } });
      if (!stage) throw new Error("Stage not found.");
      await tx.lessonStep.delete({ where: { id: stageId } });

      // Domykamy lukę w numeracji (unikalny klucz lessonId+order) – od najmniejszego do największego.
      const later = await tx.lessonStep.findMany({
        where: { lessonId, order: { gt: stage.order } },
        orderBy: { order: "asc" },
        select: { id: true, order: true },
      });
      for (const s of later) {
        await tx.lessonStep.update({ where: { id: s.id }, data: { order: s.order - 1 } });
      }
    });
    refresh();
    return { ok: true };
  } catch (e) {
    console.error("deleteStage failed", e);
    return fail("Could not delete the stage.");
  }
}