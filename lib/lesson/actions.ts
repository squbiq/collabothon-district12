// lib/lesson/actions.ts

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { parseStep, stepColumns } from "./step-parser";
import { rowToStepInput } from "./step-data";
import {
  PERSONAS,
  type CreateLessonInput,
  type CreateLessonResult,
} from "@/types/lesson-input";
import { ChapterOption, LessonSummary, LessonDetails } from "@/types/lesson-input";

const fail = (error: string): CreateLessonResult => ({ ok: false, error });
const clean = (v: unknown) => (typeof v === "string" ? v.trim() : "");

export async function createLesson(
  input: CreateLessonInput,
): Promise<CreateLessonResult> {
  // TODO: sprawdź, czy użytkownik jest zalogowany (better-auth), np.
  //   const session = await auth.api.getSession({ headers: await headers() });
  //   if (!session) return fail("Musisz być zalogowany.");

  // Dane z formularza traktujemy jako niezaufane: czyścimy i walidujemy od nowa
  const chapterId = clean(input.chapterId);
  const title = clean(input.title);
  const description = clean(input.description);
  const estimatedMinutes = Number(input.estimatedMinutes);
  const unlockAssetId = clean(input.unlockAssetId) || null;
  const targetPersonas = [
    ...new Set((input.targetPersonas ?? []).filter((p) => PERSONAS.includes(p))),
  ];

  if (!chapterId || !title || !description) {
    return fail("Uzupełnij rozdział, tytuł i opis lekcji.");
  }
  if (!Number.isInteger(estimatedMinutes) || estimatedMinutes < 1) {
    return fail("Szacowany czas musi być liczbą całkowitą (minimum 1 minuta).");
  }
  if (!Array.isArray(input.steps) || input.steps.length === 0) {
    return fail("Dodaj co najmniej jeden krok.");
  }

  const stepsData: ({ order: number } & ReturnType<typeof stepColumns>)[] = [];

  for (const [i, raw] of input.steps.entries()) {
    // walidacja jak w panelu admina
    const parsed = parseStep(raw);
    if (!parsed.ok) return fail(`Krok ${i + 1}: ${parsed.error}`);
    stepsData.push({ order: i + 1, ...stepColumns(parsed.step) });
  }

  try {
    // Brak podanego numeru = na koniec listy
    let order = Number.isInteger(input.order) && (input.order as number) >= 0
      ? (input.order as number)
      : null;
    if (order === null) {
      const last = await prisma.lesson.aggregate({ _max: { order: true } });
      order = (last._max.order ?? 0) + 1;
    }

    const lesson = await prisma.lesson.create({
      data: {
        order,
        chapterId,
        title,
        description,
        estimatedMinutes,
        experience: input.experience,
        unlockAssetId,
        targetPersonas: { create: targetPersonas.map((persona) => ({ persona })) },
        steps: { create: stepsData },
      },
      select: { id: true },
    });

    revalidatePath("/lesson-map");
    return { ok: true, id: lesson.id };
  } catch (e) {
    console.error("createLesson failed", e);
    return fail("Nie udało się zapisać lekcji. Spróbuj ponownie.");
  }
}

// 1. Pobiera listę rozdziałów do pierwszego Selecta
export async function getChapters(): Promise<ChapterOption[]> { 
    const rows = await prisma.chapter.findMany({
      orderBy : { orderNumber : "asc" },
    });

    return rows.map((row) => (
      { id: row.id, title: row.chapterTitle, topicId: row.topicId }
    ));
 }

// 2. Pobiera listę lekcji dla wybranego rozdziału do drugiego Selecta
export async function getLessonsByChapter(chapterId: string): Promise<LessonSummary[]> { 
    const rows = await prisma.lesson.findMany({
      where: { chapterId },
      orderBy: { order: "asc" },
      select: {
        id: true,
        title: true,
        order: true,
      },
    });

    return rows;
 }

// 3. Pobiera pełne dane jednej lekcji (wraz z krokami), aby wypełnić formularz
export async function getLessonById(lessonId: string): Promise<LessonDetails | null> {
  const row = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      targetPersonas: true,
      steps: { orderBy: { order: "asc" } },
    },
  });

  if (!row) return null;

  return {
    id: row.id,
    order: row.order,
    chapterId: row.chapterId, // <-- teraz bezpośrednio chapterId
    title: row.title,
    description: row.description,
    estimatedMinutes: row.estimatedMinutes,
    experience: row.experience,
    unlockAssetId: row.unlockAssetId,
    targetPersonas: row.targetPersonas.map((p) => p.persona),
    steps: row.steps.flatMap((step) => {
      const input = rowToStepInput(step);
      return input ? [input] : [];
    }),
  };
}

export async function updateLesson(
  lessonId: string,
  input: CreateLessonInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    if (!input.chapterId || !input.title.trim()) {
      return { ok: false, error: "Rozdział oraz tytuł lekcji są wymagane." };
    }

    await prisma.$transaction(async (tx) => {
      const existingLesson = await tx.lesson.findUnique({
        where: { id: lessonId },
        select: { id: true, chapterId: true, order: true },
      });

      if (!existingLesson) {
        throw new Error("Nie znaleziono lekcji do edycji.");
      }

      // Wylicz `order`, jeśli użytkownik zostawił pole puste (null)
      let lessonOrder = input.order;
      if (lessonOrder === null) {
        if (input.chapterId === existingLesson.chapterId) {
          lessonOrder = existingLesson.order;
        } else {
          const lastLesson = await tx.lesson.findFirst({
            where: { chapterId: input.chapterId },
            orderBy: { order: "desc" },
            select: { order: true },
          });
          lessonOrder = (lastLesson?.order ?? 0) + 1;
        }
      }

      // Wyczyść stare relacje
      await tx.lessonPersona.deleteMany({ where: { lessonId } });
      await tx.lessonStep.deleteMany({ where: { lessonId } });

      // Zaktualizuj lekcję
      await tx.lesson.update({
        where: { id: lessonId },
        data: {
          chapterId: input.chapterId,
          order: lessonOrder,
          title: input.title.trim(),
          description: input.description.trim(),
          estimatedMinutes: input.estimatedMinutes,
          experience: input.experience,
          unlockAssetId: input.unlockAssetId,
          targetPersonas: {
            create: input.targetPersonas.map((persona) => ({
              persona,
            })),
          },
          steps: {
            create: input.steps.map((step, index) => {
              const parsed = parseStep(step);
              if (!parsed.ok) throw new Error(`Krok ${index + 1}: ${parsed.error}`);
              return { order: index + 1, ...stepColumns(parsed.step) };
            }),
          },
        },
      });
    });

    return { ok: true };
  } catch (err) {
    console.error("Błąd podczas aktualizacji lekcji:", err);
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : "Nie udało się zapisać zmian w lekcji.",
    };
  }
}