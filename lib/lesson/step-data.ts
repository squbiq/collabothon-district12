// lib/lesson/step-data.ts
//
// Odczyt wiersza LessonStep (type + title + data) do postaci StepInput (formularz, eksport)
// i do kroku odtwarzacza. Odczyt jest łagodny: braki uzupełniamy pustymi wartościami,
// a ostateczną walidację robi parseStep.
import type { StepInput } from "@/types/lesson-input";
import type { LessonStep } from "@/types/steps";
import { isInteractiveType } from "./interactive-config";
import { isEditableStepType, parseStep } from "./step-parser";

type Row = { id: string; type: string; title: string; data: unknown };

const obj = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const str = (v: unknown) => (typeof v === "string" ? v : "");
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/** Wiersz z bazy -> dane kroku jak z formularza; null dla typu, którego panel nie obsługuje. */
export function rowToStepInput(row: Pick<Row, "type" | "title" | "data">): StepInput | null {
  const { type, title } = row;
  if (!isEditableStepType(type)) return null;
  const d = obj(row.data);

  switch (type) {
    case "story":
      return { type, title, narrative: str(d.narrative) };
    case "concept":
      return { type, title, explanation: str(d.explanation), keyTakeaway: str(d.keyTakeaway) };
    case "decision":
      return {
        type,
        title,
        scenario: str(d.scenario),
        options: list(d.options).map((o) => {
          const opt = obj(o);
          // isOptimal bywa liczbą (1/0) po migracji z kolumn SQL
          return { label: str(opt.label), isOptimal: opt.isOptimal === true || opt.isOptimal === 1, feedback: str(opt.feedback) };
        }),
      };
    case "summary":
      return { type, title, summary: str(d.summary), keyTakeaways: list(d.keyTakeaways).filter((k): k is string => typeof k === "string") };
    case "matching":
      return {
        type,
        title,
        pairs: list(d.pairs).flatMap((p) => {
          const pair = obj(p);
          return typeof pair.term === "string" && typeof pair.definition === "string" ? [{ term: pair.term, definition: pair.definition }] : [];
        }),
      };
    default:
      // growth / budget / risk / estimate: `data` to cała konfiguracja
      return isInteractiveType(type) ? ({ type, title, config: d } as unknown as StepInput) : null;
  }
}

/** Wiersz z bazy -> krok odtwarzacza (z id opcji i par). Niepoprawny krok daje null. */
export function rowToLessonStep(row: Row): LessonStep | null {
  const input = rowToStepInput(row);
  if (!input) return null;
  const parsed = parseStep(input);
  if (!parsed.ok) return null;

  const { type, title, data } = parsed.step;
  const base = { id: row.id, title };
  switch (type) {
    case "matching":
      return { ...base, type, pairs: (data as { pairs: { term: string; definition: string }[] }).pairs.map((p, i) => ({ id: `${row.id}:${i}`, ...p })) };
    case "growth":
    case "budget":
    case "risk":
    case "estimate":
      return { ...base, type, config: data } as LessonStep;
    default:
      // story / concept / decision / summary mają w `data` dokładnie pola kroku odtwarzacza
      return { ...base, type, ...data } as LessonStep;
  }
}
