// lib/daily/validate.ts
//
// Walidacja zadania dziennego – wspólna dla formularza admina i importu z pliku (dane są niezaufane).
import type { DailyTaskInput } from "./admin-types";

const clean = (v: unknown) => (typeof v === "string" ? v.trim() : "");

export type ValidatedTask = {
  category: string;
  title: string;
  scenario: string;
  rewardExp: number;
  options: { id?: string; label: string; isOptimal: boolean; feedback: string }[];
};

export type ValidateResult = { ok: true; data: ValidatedTask } | { ok: false; error: string };

const fail = (error: string): ValidateResult => ({ ok: false, error });

export function validateDailyTask(input: DailyTaskInput): ValidateResult {
  const category = clean(input.category);
  const title = clean(input.title);
  const scenario = clean(input.scenario);
  const rewardExp = Number(input.rewardExp);

  if (!category || !title || !scenario) return fail("Fill in the category, title and scenario.");
  if (category.length > 191 || title.length > 191) return fail("Category and title are too long (max 191 characters).");
  if (!Number.isInteger(rewardExp) || rewardExp < 0 || rewardExp > 1_000_000) {
    return fail("Reward must be a whole number (0 or more).");
  }

  const options = (Array.isArray(input.options) ? input.options : []).map((o) => ({
    id: clean(o?.id) || undefined,
    label: clean(o?.label),
    isOptimal: o?.isOptimal === true,
    feedback: clean(o?.feedback),
  }));
  if (options.length < 2) return fail("Add at least 2 options.");
  if (options.some((o) => !o.label || !o.feedback)) return fail("Every option needs a label and feedback.");
  if (options.some((o) => o.label.length > 191)) return fail("An option label is too long (max 191 characters).");
  if (options.filter((o) => o.isOptimal).length !== 1) return fail("Exactly one option must be correct.");

  return { ok: true, data: { category, title, scenario, rewardExp, options } };
}
