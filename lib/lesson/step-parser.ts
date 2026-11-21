// lib/lesson/step-parser.ts
//
// Walidacja i normalizacja kroku wysyłanego z formularza (dane są niezaufane).
// Wynik ma zawsze wszystkie kolumny kroku – nieużywane są null, dzięki czemu
// zmiana typu kroku czyści stare pola.
import { Prisma } from "@/gen/prisma/client";
import type { StepInput } from "@/types/lesson-input";

export type ParsedStep = {
  type: StepInput["type"];
  title: string;
  narrative: string | null;
  explanation: string | null;
  keyTakeaway: string | null;
  scenario: string | null;
  summary: string | null;
  keyTakeaways: string[] | null;
  options: { order: number; label: string; isOptimal: boolean; feedback: string }[];
};

// Typy kroków obsługiwane przez panel admina (enum w bazie ma też m.in. fill i match).
export const EDITABLE_STEP_TYPES = ["story", "concept", "decision", "summary"] as const;
export const isEditableStepType = (t: string): t is StepInput["type"] =>
  (EDITABLE_STEP_TYPES as readonly string[]).includes(t);

export type ParseResult = { ok: true; step: ParsedStep } | { ok: false; error: string };

const clean = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const fail = (error: string): ParseResult => ({ ok: false, error });

export function parseStep(raw: StepInput): ParseResult {
  const title = clean(raw.title);
  if (!title) return fail("Enter a stage title.");

  const base: ParsedStep = {
    type: raw.type,
    title,
    narrative: null,
    explanation: null,
    keyTakeaway: null,
    scenario: null,
    summary: null,
    keyTakeaways: null,
    options: [],
  };

  switch (raw.type) {
    case "story": {
      const narrative = clean(raw.narrative);
      if (!narrative) return fail("Enter the story text.");
      return { ok: true, step: { ...base, narrative } };
    }
    case "concept": {
      const explanation = clean(raw.explanation);
      const keyTakeaway = clean(raw.keyTakeaway);
      if (!explanation || !keyTakeaway) return fail("Fill in the explanation and the key takeaway.");
      return { ok: true, step: { ...base, explanation, keyTakeaway } };
    }
    case "decision": {
      const scenario = clean(raw.scenario);
      const options = (Array.isArray(raw.options) ? raw.options : []).map((o, i) => ({
        order: i + 1,
        label: clean(o.label),
        isOptimal: o.isOptimal === true,
        feedback: clean(o.feedback),
      }));
      if (!scenario) return fail("Describe the scenario.");
      if (options.length < 2 || options.some((o) => !o.label || !o.feedback)) {
        return fail("Add at least 2 options, each with a label and feedback.");
      }
      if (!options.some((o) => o.isOptimal)) return fail("Mark the best option.");
      return { ok: true, step: { ...base, scenario, options } };
    }
    case "summary": {
      const summary = clean(raw.summary);
      const keyTakeaways = (Array.isArray(raw.keyTakeaways) ? raw.keyTakeaways : [])
        .map(clean)
        .filter(Boolean);
      if (!summary) return fail("Enter the summary.");
      return { ok: true, step: { ...base, summary, keyTakeaways } };
    }
    default:
      return fail("Unknown stage type.");
  }
}

// Kolumny kroku zapisywane do bazy (nieużywane pola czyszczą się do null).
export function stepColumns(step: ParsedStep) {
  return {
    type: step.type,
    title: step.title,
    narrative: step.narrative,
    explanation: step.explanation,
    keyTakeaway: step.keyTakeaway,
    scenario: step.scenario,
    summary: step.summary,
    keyTakeaways: step.keyTakeaways ?? Prisma.JsonNull,
  };
}
