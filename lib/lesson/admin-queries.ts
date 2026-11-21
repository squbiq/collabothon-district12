// lib/lesson/admin-queries.ts
//
// Odczyty dla panelu admina (używane w komponentach serwerowych).
// To NIE jest plik "use server", więc funkcje nie są wystawione jako publiczne akcje.
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { isEditableStepType } from "./step-parser";
import { rowToStepInput } from "./step-data";
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
  return rows.map(({ steps, ...lesson }) => ({
    ...lesson,
    // kroki typów, których panel nie umie edytować, nie trafiają do menu
    stages: steps.flatMap((s) => (isEditableStepType(s.type) ? [{ ...s, type: s.type }] : [])),
  }));
}

export async function getChapterOptions(): Promise<ChapterOption[]> {
  await requireAdmin();
  const rows = await prisma.chapter.findMany({ orderBy: { orderNumber: "asc" } });
  return rows.map((r) => ({ id: r.id, title: r.chapterTitle, topicId: r.topicId }));
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
    experience: row.experience,
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
    include: { lesson: { select: { title: true } } },
  });
  const input = step && rowToStepInput(step);
  if (!step || !input) return null;

  return { lessonTitle: step.lesson.title, position: step.order, stage: { ...input, id: step.id } };
}

export type TopicForEdit = {
  id: string;
  title: string;
  chapters: { id: string; title: string; lessonCount: number }[];
};

export async function getTopicForEdit(id: string): Promise<TopicForEdit | null> {
  await requireAdmin();
  const row = await prisma.topic.findUnique({
    where: { id },
    include: {
      Chapter: {
        orderBy: [{ orderNumber: "asc" }, { id: "asc" }],
        include: { _count: { select: { Lessons: true } } },
      },
    },
  });
  if (!row) return null;
  return {
    id: row.id,
    title: row.topicTitle,
    chapters: row.Chapter.map((c) => ({ id: c.id, title: c.chapterTitle, lessonCount: c._count.Lessons })),
  };
}
