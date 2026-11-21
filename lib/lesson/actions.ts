// lib/lesson/actions.ts

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isEditableStepType, parseStep } from "./step-parser";
import {
  PERSONAS,
  type CreateLessonInput,
  type CreateLessonResult,
  type StepInput,
} from "@/types/lesson-input";
import { ChapterOption, LessonSummary, LessonDetails } from "@/types/lesson-input";

type StepCreate = {
  order: number;
  type: StepInput["type"];
  title: string;
  narrative?: string;
  explanation?: string;
  keyTakeaway?: string;
  scenario?: string;
  summary?: string;
  keyTakeaways?: string[];
  pairs?: { term: string; definition: string }[];
  options?: {
    create: { order: number; label: string; isOptimal: boolean; feedback: string }[];
  };
};

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

  const stepsData: StepCreate[] = [];

  for (const [i, raw] of input.steps.entries()) {
    const label = `Krok ${i + 1}`;
    const stepTitle = clean(raw.title);
    if (!stepTitle) return fail(`${label}: podaj tytuł.`);

    switch (raw.type) {
      case "story": {
        const narrative = clean(raw.narrative);
        if (!narrative) return fail(`${label}: wpisz treść historii.`);
        stepsData.push({ order: i + 1, type: "story", title: stepTitle, narrative });
        break;
      }
      case "concept": {
        const explanation = clean(raw.explanation);
        const keyTakeaway = clean(raw.keyTakeaway);
        if (!explanation || !keyTakeaway) {
          return fail(`${label}: uzupełnij wyjaśnienie i najważniejszy wniosek.`);
        }
        stepsData.push({
          order: i + 1,
          type: "concept",
          title: stepTitle,
          explanation,
          keyTakeaway,
        });
        break;
      }
      case "decision": {
        const scenario = clean(raw.scenario);
        const options = (Array.isArray(raw.options) ? raw.options : []).map((o, j) => ({
          order: j + 1,
          label: clean(o.label),
          isOptimal: o.isOptimal === true,
          feedback: clean(o.feedback),
        }));
        if (!scenario) return fail(`${label}: opisz scenariusz.`);
        if (options.length < 2 || options.some((o) => !o.label || !o.feedback)) {
          return fail(`${label}: dodaj co najmniej 2 opcje, każda z treścią i feedbackiem.`);
        }
        if (!options.some((o) => o.isOptimal)) {
          return fail(`${label}: zaznacz najlepszą opcję.`);
        }
        stepsData.push({
          order: i + 1,
          type: "decision",
          title: stepTitle,
          scenario,
          options: { create: options },
        });
        break;
      }
      case "summary": {
        const summary = clean(raw.summary);
        const keyTakeaways = (Array.isArray(raw.keyTakeaways) ? raw.keyTakeaways : [])
          .map(clean)
          .filter(Boolean);
        if (!summary) return fail(`${label}: wpisz podsumowanie.`);
        stepsData.push({
          order: i + 1,
          type: "summary",
          title: stepTitle,
          summary,
          keyTakeaways,
        });
        break;
      }
      case "matching": {
        // walidacja jak w panelu admina (liczba i unikalność par)
        const parsed = parseStep(raw);
        if (!parsed.ok) return fail(`${label}: ${parsed.error}`);
        stepsData.push({ order: i + 1, type: "matching", title: stepTitle, pairs: parsed.step.pairs ?? [] });
        break;
      }
      default:
        return fail(`${label}: nieznany typ kroku.`);
    }
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
      steps: {
        orderBy: { order: "asc" },
        include: {
          options: { orderBy: { order: "asc" } },
        },
      },
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
    steps: row.steps.filter((step) => isEditableStepType(step.type)).map((step): StepInput => {
      switch (step.type) {
        case "story":
          return {
            type: "story",
            title: step.title,
            narrative: step.narrative ?? "",
          };
        case "concept":
          return {
            type: "concept",
            title: step.title,
            explanation: step.explanation ?? "",
            keyTakeaway: step.keyTakeaway ?? "",
          };
        case "decision":
          return {
            type: "decision",
            title: step.title,
            scenario: step.scenario ?? "",
            options: step.options.map((o) => ({
              label: o.label,
              isOptimal: o.isOptimal,
              feedback: o.feedback,
            })),
          };
        case "summary":
          return {
            type: "summary",
            title: step.title,
            summary: step.summary ?? "",
            keyTakeaways: Array.isArray(step.keyTakeaways)
              ? (step.keyTakeaways as string[])
              : [],
          };
        case "matching":
          return {
            type: "matching",
            title: step.title,
            pairs: Array.isArray(step.pairs) ? (step.pairs as { term: string; definition: string }[]) : [],
          };
        default:
          // niedostępne – kroki innych typów odfiltrowaliśmy wyżej
          throw new Error(`Unsupported step type: ${step.type}`);
      }
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
              const baseStep = {
                order: index + 1,
                type: step.type,
                title: step.title,
              };

              switch (step.type) {
                case "story":
                  return { ...baseStep, narrative: step.narrative };
                case "concept":
                  return {
                    ...baseStep,
                    explanation: step.explanation,
                    keyTakeaway: step.keyTakeaway,
                  };
                case "decision":
                  return {
                    ...baseStep,
                    scenario: step.scenario,
                    options: {
                      create: step.options.map((opt, optIndex) => ({
                        order: optIndex + 1,
                        label: opt.label,
                        isOptimal: opt.isOptimal,
                        feedback: opt.feedback,
                      })),
                    },
                  };
                case "summary":
                  return {
                    ...baseStep,
                    summary: step.summary,
                    keyTakeaways: step.keyTakeaways,
                  };
                case "matching":
                  return { ...baseStep, pairs: step.pairs.map(({ term, definition }) => ({ term, definition })) };
              }
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