// lib/lesson/step-parser.ts
//
// Walidacja i normalizacja kroku wysyłanego z formularza (dane są niezaufane).
// Wynik to wspólne kolumny (type, title) + `data` – jedyny Json z zawartością kroku
// (kształt dla każdego typu opisuje types/step-data.ts).
import { Prisma } from "@/gen/prisma/client";
import type { StepInput } from "@/types/lesson-input";
import type { StepData, StepKind } from "@/types/step-data";
import { isInteractiveType, parseConfig } from "./interactive-config";

export type ParsedStep = {
  type: StepKind;
  title: string;
  data: StepData;
};

// Typy kroków obsługiwane przez panel admina.
export const EDITABLE_STEP_TYPES = ["story", "concept", "decision", "summary", "matching", "growth", "budget", "risk", "estimate"] as const;
export const isEditableStepType = (t: string): t is StepInput["type"] =>
  (EDITABLE_STEP_TYPES as readonly string[]).includes(t);

export type ParseResult = { ok: true; step: ParsedStep } | { ok: false; error: string };

const MAX_VARCHAR = 191; // tyle mieszczą kolumny String w bazie
const MIN_PAIRS = 2;
const MAX_PAIRS = 6;

const clean = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const fail = (error: string): ParseResult => ({ ok: false, error });

// Dane z klienta są niezaufane – błędny kształt (np. null zamiast obiektu) kończy się błędem walidacji, nie wyjątkiem.
export function parseStep(raw: StepInput): ParseResult {
  try {
    const result = parseStepUnsafe(raw);
    if (result.ok) {
      const { step } = result;
      const labels = step.type === "decision" ? (step.data as StepData<"decision">).options.map((o) => o.label) : [];
      if (step.title.length > MAX_VARCHAR || labels.some((l) => l.length > MAX_VARCHAR)) {
        return fail(`A title or option label is too long (max ${MAX_VARCHAR} characters).`);
      }
    }
    return result;
  } catch {
    return fail("Invalid stage data.");
  }
}

function parseStepUnsafe(raw: StepInput): ParseResult {
  const title = clean(raw.title);
  if (!title) return fail("Enter a stage title.");
  const ok = (data: StepData): ParseResult => ({ ok: true, step: { type: raw.type, title, data } });

  switch (raw.type) {
    case "story": {
      const narrative = clean(raw.narrative);
      if (!narrative) return fail("Enter the story text.");
      return ok({ narrative });
    }
    case "concept": {
      const explanation = clean(raw.explanation);
      const keyTakeaway = clean(raw.keyTakeaway);
      if (!explanation || !keyTakeaway) return fail("Fill in the explanation and the key takeaway.");
      return ok({ explanation, keyTakeaway });
    }
    case "decision": {
      const scenario = clean(raw.scenario);
      const options = (Array.isArray(raw.options) ? raw.options : []).map((o, i) => ({
        id: `option-${i + 1}`,
        label: clean(o.label),
        isOptimal: o.isOptimal === true,
        feedback: clean(o.feedback),
      }));
      if (!scenario) return fail("Describe the scenario.");
      if (options.length < 2 || options.some((o) => !o.label || !o.feedback)) {
        return fail("Add at least 2 options, each with a label and feedback.");
      }
      if (!options.some((o) => o.isOptimal)) return fail("Mark the best option.");
      return ok({ scenario, options });
    }
    case "summary": {
      const summary = clean(raw.summary);
      const keyTakeaways = (Array.isArray(raw.keyTakeaways) ? raw.keyTakeaways : []).map(clean).filter(Boolean);
      if (!summary) return fail("Enter the summary.");
      return ok({ summary, keyTakeaways });
    }
    case "matching": {
      const pairs = (Array.isArray(raw.pairs) ? raw.pairs : []).map((p) => ({
        term: clean(p.term),
        definition: clean(p.definition),
      }));
      if (pairs.length < MIN_PAIRS || pairs.some((p) => !p.term || !p.definition)) {
        return fail(`Add at least ${MIN_PAIRS} pairs, each with a definition and a term.`);
      }
      if (pairs.length > MAX_PAIRS) return fail(`Use at most ${MAX_PAIRS} pairs.`);

      const terms = new Set(pairs.map((p) => p.term.toLowerCase()));
      const definitions = new Set(pairs.map((p) => p.definition.toLowerCase()));
      if (terms.size !== pairs.length || definitions.size !== pairs.length) {
        return fail("Each term and each definition must be unique.");
      }
      return ok({ pairs });
    }
    case "growth":
    case "budget":
    case "risk":
    case "estimate": {
      const type = raw.type;
      if (!isInteractiveType(type)) return fail("Unknown stage type.");
      const parsed = parseConfig(type, raw.config);
      if (!parsed.ok) return fail(parsed.error);
      return ok(parsed.config);
    }
    default:
      return fail("Unknown stage type.");
  }
}

// Kolumny kroku zapisywane do bazy.
export function stepColumns(step: ParsedStep) {
  return {
    type: step.type,
    title: step.title,
    data: step.data as unknown as Prisma.InputJsonObject,
  };
}
