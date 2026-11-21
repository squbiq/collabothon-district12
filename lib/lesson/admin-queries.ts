// lib/lesson/admin-queries.ts
//
// Odczyty dla panelu admina (używane w komponentach serwerowych).
// To NIE jest plik "use server", więc funkcje nie są wystawione jako publiczne akcje.
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import type { ChapterOption, LessonDataInput, StageDetails } from "@/types/lesson-input";

export type LessonTreeStage = { id: string; title: string; type: StageDetails["type"] };
export type LessonTreeItem = { id: string; title: string; stages: LessonTreeStage[] };

// Wszystkie lekcje z etapami – dane dla BranchedMenu.
export async function getLessonTree(): Promise<LessonTreeItem[]> {
  await requireAdmin();
  const rows = await prisma.lesson.findMany({
    orderBy: { order: "asc" },
    select: {
      id: true,
      title: true,
      steps: { orderBy: { order: "asc" }, select: { id: true, title: true, type: true } },
    },
  });
  return rows.map(({ steps, ...lesson }) => ({ ...lesson, stages: steps }));
}

export async function getChapterOptions(): Promise<ChapterOption[]> {
  await requireAdmin();
  const rows = await prisma.chapter.findMany({ orderBy: { orderNumber: "asc" } });
  return rows.map((r) => ({ id: r.id, title: r.chapterTitle }));
}

export async function getLessonForEdit(
  id: string
): Promise<(LessonDataInput & { id: string }) | null> {
  await requireAdmin();
  const row = await prisma.lesson.findUnique({
    where: { id },
    include: { targetPersonas: true },
  });
  if (!row) return null;

  return {
    id: row.id,
    order: row.order,
    chapterId: row.chapterId,
    title: row.title,
    description: row.description,
    estimatedMinutes: row.estimatedMinutes,
    unlockAssetId: row.unlockAssetId,
    targetPersonas: row.targetPersonas.map((p) => p.persona),
  };
}

export async function getStageForEdit(
  lessonId: string,
  stageId: string
): Promise<{ lessonTitle: string; position: number; stage: StageDetails } | null> {
  await requireAdmin();
  const step = await prisma.lessonStep.findFirst({
    where: { id: stageId, lessonId },
    include: { options: { orderBy: { order: "asc" } }, lesson: { select: { title: true } } },
  });
  if (!step) return null;

  const base = { id: step.id, title: step.title };
  let stage: StageDetails;

  switch (step.type) {
    case "story":
      stage = { ...base, type: "story", narrative: step.narrative ?? "" };
      break;
    case "concept":
      stage = {
        ...base,
        type: "concept",
        explanation: step.explanation ?? "",
        keyTakeaway: step.keyTakeaway ?? "",
      };
      break;
    case "decision":
      stage = {
        ...base,
        type: "decision",
        scenario: step.scenario ?? "",
        options: step.options.map(({ label, isOptimal, feedback }) => ({ label, isOptimal, feedback })),
      };
      break;
    case "summary":
      stage = {
        ...base,
        type: "summary",
        summary: step.summary ?? "",
        keyTakeaways: Array.isArray(step.keyTakeaways) ? (step.keyTakeaways as string[]) : [],
      };
      break;
  }

  return { lessonTitle: step.lesson.title, position: step.order, stage };
}
