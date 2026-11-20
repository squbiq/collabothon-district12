// lib/lesson/actions.ts

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  PERSONAS,
  type CreateLessonInput,
  type CreateLessonResult,
  type StepInput,
} from "@/types/lesson-input";

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
  const chapterTitle = clean(input.chapterTitle);
  const title = clean(input.title);
  const description = clean(input.description);
  const estimatedMinutes = Number(input.estimatedMinutes);
  const unlockAssetId = clean(input.unlockAssetId) || null;
  const targetPersonas = [
    ...new Set((input.targetPersonas ?? []).filter((p) => PERSONAS.includes(p))),
  ];

  if (!chapterTitle || !title || !description) {
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
        chapterTitle,
        title,
        description,
        estimatedMinutes,
        unlockAssetId,
        targetPersonas: { create: targetPersonas.map((persona) => ({ persona })) },
        steps: { create: stepsData },
      },
      select: { id: true },
    });

    revalidatePath("/topic");
    return { ok: true, id: lesson.id };
  } catch (e) {
    console.error("createLesson failed", e);
    return fail("Nie udało się zapisać lekcji. Spróbuj ponownie.");
  }
}