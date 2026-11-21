// lib/lesson/transfer-parse.ts
//
// Walidacja pliku JSON z importu lekcji (dane są niezaufane).
// Struktura jest sprawdzana przez zod, a treść kroków przez ten sam parseStep co formularze.
import { z } from "zod";
import { LESSON_EXPORT_FORMAT, LESSON_EXPORT_VERSION } from "@/types/lesson-transfer";
import type { StepInput } from "@/types/lesson-input";
import { EDITABLE_STEP_TYPES, parseStep, type ParsedStep } from "./step-parser";

const STEP_TYPES: readonly string[] = EDITABLE_STEP_TYPES;
const MAX_VARCHAR = 191; // tyle mieszczą kolumny String w bazie

const optionalId = z.string().trim().min(1).max(MAX_VARCHAR).optional();
const name = z.string().trim().min(1).max(MAX_VARCHAR);

const lessonSchema = z.object({
  id: optionalId,
  order: z.number().int().min(0).nullable().optional(),
  title: name,
  description: z.string().trim().min(1),
  estimatedMinutes: z.number().int().min(1),
  experience: z.number().int().min(0).default(0),
  unlockAssetId: z.string().trim().min(1).max(MAX_VARCHAR).nullable().optional(),
  targetPersonas: z.array(z.enum(["starter", "family"])).default([]),
  topic: z.object({ id: optionalId, title: name }),
  chapter: z.object({ id: optionalId, title: name }),
  steps: z.array(z.record(z.string(), z.unknown())).default([]),
});

const fileSchema = z.object({
  format: z.literal(LESSON_EXPORT_FORMAT),
  version: z.literal(LESSON_EXPORT_VERSION),
  lessons: z.array(lessonSchema).min(1).max(500),
});

export type ParsedLesson = Omit<z.infer<typeof lessonSchema>, "steps"> & { steps: ParsedStep[] };

export type ParseFileResult = { ok: true; lessons: ParsedLesson[] } | { ok: false; error: string };

const fail = (error: string): ParseFileResult => ({ ok: false, error });

export function parseLessonFile(text: string): ParseFileResult {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return fail("This file is not valid JSON.");
  }

  const result = fileSchema.safeParse(json);
  if (!result.success) {
    const issue = result.error.issues[0];
    return fail(`Invalid file (${issue.path.map(String).join(".") || "root"}): ${issue.message}`);
  }

  const lessons: ParsedLesson[] = [];
  for (const [li, lesson] of result.data.lessons.entries()) {
    const steps: ParsedStep[] = [];
    for (const [si, raw] of lesson.steps.entries()) {
      const where = `Lesson ${li + 1} ("${lesson.title}"), stage ${si + 1}`;
      if (typeof raw.type !== "string" || !STEP_TYPES.includes(raw.type)) {
        return fail(`${where}: unknown stage type.`);
      }
      try {
        const parsed = parseStep(raw as unknown as StepInput);
        if (!parsed.ok) return fail(`${where}: ${parsed.error}`);
        const { step } = parsed;
        if (step.title.length > MAX_VARCHAR || step.options.some((o) => o.label.length > MAX_VARCHAR)) {
          return fail(`${where}: a title or option label is too long (max ${MAX_VARCHAR} characters).`);
        }
        steps.push(step);
      } catch {
        return fail(`${where}: malformed stage data.`);
      }
    }
    lessons.push({ ...lesson, steps });
  }
  return { ok: true, lessons };
}
