// lib/lesson/transfer-actions.ts
//
// Akcje serwerowe: eksport i import lekcji w formacie JSON (tylko admin).
"use server";

import { refresh as refreshRouter, revalidatePath } from "next/cache";
import type { Prisma } from "@/gen/prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import {
  LESSON_EXPORT_FORMAT,
  LESSON_EXPORT_VERSION,
  type LessonExportFile,
  type LessonExportLesson,
} from "@/types/lesson-transfer";
import type { StepInput } from "@/types/lesson-input";
import { stepColumns } from "./step-parser";
import { parseLessonFile, type ParsedLesson } from "./transfer-parse";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });
const MAX_IMPORT_CHARS = 4_500_000;

// Pary z kolumny Json – pomija elementy o złym kształcie.
function toPairs(value: unknown): { term: string; definition: string }[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const p = item as { term?: unknown; definition?: unknown } | null;
    return p && typeof p.term === "string" && typeof p.definition === "string"
      ? [{ term: p.term, definition: p.definition }]
      : [];
  });
}

async function isAdmin() {
  const session = await getSession();
  return session?.user.role === "admin";
}

// ---------- Eksport ----------

type ExportOptions = {
  /** Brak = wszystkie lekcje. */
  ids?: string[];
  /** Eksport przenośny: bez ID lekcji, tematu, rozdziału i powiązanego zasobu. */
  stripIds?: boolean;
};

export async function exportLessons(
  options: ExportOptions = {}
): Promise<Result<{ json: string; filename: string; count: number }>> {
  if (!(await isAdmin())) return fail("Forbidden.");

  try {
    const rows = await prisma.lesson.findMany({
      where: options.ids ? { id: { in: options.ids } } : undefined,
      orderBy: { order: "asc" },
      include: {
        chapter: { include: { Topic: true } },
        targetPersonas: true,
        steps: { orderBy: { order: "asc" }, include: { options: { orderBy: { order: "asc" } } } },
      },
    });
    if (rows.length === 0) return fail("There are no lessons to export.");

    const lessons: LessonExportLesson[] = [];
    for (const row of rows) {
      const steps: StepInput[] = [];
      for (const s of row.steps) {
        switch (s.type) {
          case "story":
            steps.push({ type: "story", title: s.title, narrative: s.narrative ?? "" });
            break;
          case "concept":
            steps.push({ type: "concept", title: s.title, explanation: s.explanation ?? "", keyTakeaway: s.keyTakeaway ?? "" });
            break;
          case "decision":
            steps.push({
              type: "decision",
              title: s.title,
              scenario: s.scenario ?? "",
              options: s.options.map((o) => ({ label: o.label, isOptimal: o.isOptimal, feedback: o.feedback })),
            });
            break;
          case "summary":
            steps.push({
              type: "summary",
              title: s.title,
              summary: s.summary ?? "",
              keyTakeaways: Array.isArray(s.keyTakeaways) ? s.keyTakeaways.filter((k): k is string => typeof k === "string") : [],
            });
            break;
          case "matching":
            steps.push({ type: "matching", title: s.title, pairs: toPairs(s.pairs) });
            break;
          case "growth":
          case "budget":
          case "risk":
          case "estimate":
            if (s.config && typeof s.config === "object") {
              steps.push({ type: s.type, title: s.title, config: s.config } as StepInput);
            }
            break;
        }
      }

      const strip = options.stripIds === true;
      lessons.push({
        ...(strip ? {} : { id: row.id }),
        order: row.order,
        title: row.title,
        description: row.description,
        estimatedMinutes: row.estimatedMinutes,
        experience: row.experience,
        ...(strip ? {} : { unlockAssetId: row.unlockAssetId }),
        targetPersonas: row.targetPersonas.map((p) => p.persona),
        topic: { ...(strip ? {} : { id: row.chapter.Topic.id }), title: row.chapter.Topic.topicTitle },
        chapter: { ...(strip ? {} : { id: row.chapter.id }), title: row.chapter.chapterTitle },
        steps,
      });
    }

    const file: LessonExportFile = { format: LESSON_EXPORT_FORMAT, version: LESSON_EXPORT_VERSION, lessons };
    const slug = rows[0].title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
    const filename = rows.length === 1 && slug ? `lesson-${slug}.json` : `lessons-${new Date().toISOString().slice(0, 10)}.json`;
    return { ok: true, json: JSON.stringify(file, null, 2), filename, count: rows.length };
  } catch (e) {
    console.error("exportLessons failed", e);
    return fail("Could not export the lessons.");
  }
}

// ---------- Import ----------

type Tx = Prisma.TransactionClient;

// Zwraca id rozdziału: istniejący po ID, a w razie braku – temat i rozdział dopasowane po tytule (albo utworzone).
async function resolveChapter(tx: Tx, lesson: ParsedLesson, useIds: boolean): Promise<string> {
  const { topic, chapter } = lesson;

  if (useIds && chapter.id) {
    const existing = await tx.chapter.findUnique({ where: { id: chapter.id }, select: { id: true } });
    if (existing) return existing.id;
  }

  let topicId: string | null = null;
  if (useIds && topic.id) topicId = (await tx.topic.findUnique({ where: { id: topic.id }, select: { id: true } }))?.id ?? null;
  topicId ??= (await tx.topic.findFirst({ where: { topicTitle: topic.title }, select: { id: true } }))?.id ?? null;
  if (!topicId) {
    const created = await tx.topic.create({
      data: { ...(useIds && topic.id ? { id: topic.id } : {}), topicTitle: topic.title },
      select: { id: true },
    });
    topicId = created.id;
  }

  const sameTitle = await tx.chapter.findFirst({ where: { topicId, chapterTitle: chapter.title }, select: { id: true } });
  if (sameTitle) return sameTitle.id;

  const last = await tx.chapter.aggregate({ where: { topicId }, _max: { orderNumber: true } });
  const created = await tx.chapter.create({
    data: {
      ...(useIds && chapter.id ? { id: chapter.id } : {}),
      topicId,
      chapterTitle: chapter.title,
      orderNumber: (last._max.orderNumber ?? 0) + 1,
    },
    select: { id: true },
  });
  return created.id;
}

export async function importLessons(
  text: string,
  options: { ignoreIds?: boolean } = {}
): Promise<Result<{ created: number; updated: number }>> {
  if (!(await isAdmin())) return fail("Forbidden.");
  if (typeof text !== "string" || text.length > MAX_IMPORT_CHARS) return fail("The file is too large.");

  const parsed = parseLessonFile(text);
  if (!parsed.ok) return fail(parsed.error);

  const useIds = options.ignoreIds !== true;

  try {
    // Jedna transakcja: albo importujemy cały plik, albo nic.
    const counts = await prisma.$transaction(
      async (tx) => {
        let created = 0;
        let updated = 0;

        for (const lesson of parsed.lessons) {
          const chapterId = await resolveChapter(tx, lesson, useIds);
          const existing =
            useIds && lesson.id ? await tx.lesson.findUnique({ where: { id: lesson.id }, select: { id: true } }) : null;

          const base = {
            chapterId,
            title: lesson.title,
            description: lesson.description,
            estimatedMinutes: lesson.estimatedMinutes,
            experience: lesson.experience,
            unlockAssetId: lesson.unlockAssetId ?? null,
          };
          const relations = {
            targetPersonas: { create: lesson.targetPersonas.map((persona) => ({ persona })) },
            steps: {
              create: lesson.steps.map((step, i) => ({
                order: i + 1,
                ...stepColumns(step),
                options: { create: step.options },
              })),
            },
          };

          if (existing) {
            // Lekcja o tym ID istnieje – zastępujemy jej persony i kroki (opcje kasują się kaskadowo).
            await tx.lessonPersona.deleteMany({ where: { lessonId: existing.id } });
            await tx.lessonStep.deleteMany({ where: { lessonId: existing.id } });
            await tx.lesson.update({
              where: { id: existing.id },
              data: { ...base, ...(lesson.order != null ? { order: lesson.order } : {}), ...relations },
            });
            updated++;
          } else {
            const last = await tx.lesson.aggregate({ _max: { order: true } });
            await tx.lesson.create({
              data: {
                ...(useIds && lesson.id ? { id: lesson.id } : {}),
                ...base,
                order: lesson.order ?? (last._max.order ?? 0) + 1,
                ...relations,
              },
            });
            created++;
          }
        }
        return { created, updated };
      },
      { timeout: 60_000 }
    );

    revalidatePath("/panel/lesson", "layout");
    revalidatePath("/lesson-map");
    refreshRouter();
    return { ok: true, ...counts };
  } catch (e) {
    console.error("importLessons failed", e);
    return fail("Import failed, nothing was saved. Check the file and try again.");
  }
}
