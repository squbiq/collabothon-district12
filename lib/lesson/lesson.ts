// lib/lesson/lesson.ts

import { prisma } from "@/lib/prisma";
import type { Lesson } from "@/types/lesson";
import type { LessonStep } from "@/types/steps";
import { toLessonBase } from "./mappers";
import { isInteractiveType, parseConfig } from "./interactive-config";

// ---- Pobieranie z bazy ----

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string")
    : [];
}

function toPairs(value: unknown): { term: string; definition: string }[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const p = item as { term?: unknown; definition?: unknown } | null;
    return p && typeof p.term === "string" && typeof p.definition === "string"
      ? [{ term: p.term, definition: p.definition }]
      : [];
  });
}

export async function getLesson(id: string): Promise<Lesson | null> {
    const row = await prisma.lesson.findUnique({
    where: { id },
    include: {
      chapter: true,
      targetPersonas: true,
      steps: {
        orderBy: { order: "asc" },
        include: { options: { orderBy: { order: "asc" } } },
      },
    },
  });

  if (!row) return null;

  // Składamy wiersze z bazy w typy unii LessonStep.
  // Krok z brakującymi danymi jest pomijany (z ostrzeżeniem w konsoli).
  const steps = row.steps.flatMap((s): LessonStep[] => {
    const base = { id: s.id, title: s.title };

    switch (s.type) {
      case "story":
        if (s.narrative) return [{ ...base, type: "story", narrative: s.narrative }];
        break;
      case "concept":
        if (s.explanation && s.keyTakeaway)
          return [
            {
              ...base,
              type: "concept",
              explanation: s.explanation,
              keyTakeaway: s.keyTakeaway,
            },
          ];
        break;
      case "decision":
        if (s.scenario && s.options.length > 0)
          return [
            {
              ...base,
              type: "decision",
              scenario: s.scenario,
              options: s.options.map((o) => ({
                id: o.id,
                label: o.label,
                isOptimal: o.isOptimal,
                feedback: o.feedback,
              })),
            },
          ];
        break;
      case "summary":
        if (s.summary)
          return [
            {
              ...base,
              type: "summary",
              summary: s.summary,
              keyTakeaways: toStringArray(s.keyTakeaways),
            },
          ];
        break;
      case "matching": {
        const pairs = toPairs(s.pairs);
        if (pairs.length >= 2) {
          return [{ ...base, type: "matching", pairs: pairs.map((p, i) => ({ id: `${s.id}:${i}`, ...p })) }];
        }
        break;
      }
      case "growth":
      case "budget":
      case "risk":
      case "estimate": {
        if (!isInteractiveType(s.type)) break;
        // zapisane ustawienia są sprawdzane tak samo jak przy zapisie – uszkodzone dane pomijają krok
        const parsed = parseConfig(s.type, s.config);
        if (parsed.ok) return [{ ...base, type: s.type, config: parsed.config } as LessonStep];
        break;
      }
    }

    console.warn(`Pominięto niepoprawny krok ${s.id} (${s.type}) w lekcji ${id}`);
    console.warn(s.options);
    return [];
  });

  return { ...toLessonBase(row), steps };
}