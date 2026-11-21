// lib/daily/transfer-parse.ts
//
// Walidacja pliku JSON z importu zadań dziennych (dane są niezaufane).
// Struktura jest sprawdzana przez zod, a reguły zadania tą samą funkcją co formularz admina.
import { z } from "zod";
import { DAILY_EXPORT_FORMAT, DAILY_EXPORT_VERSION } from "@/types/daily-transfer";
import { validateDailyTask, type ValidatedTask } from "./validate";

const taskSchema = z.object({
  id: z.string().trim().min(1).max(191).optional(),
  category: z.string(),
  title: z.string(),
  scenario: z.string(),
  rewardExp: z.number(),
  options: z.array(z.object({ label: z.string(), isOptimal: z.boolean(), feedback: z.string() })),
});

const fileSchema = z.object({
  format: z.literal(DAILY_EXPORT_FORMAT),
  version: z.literal(DAILY_EXPORT_VERSION),
  tasks: z.array(taskSchema).min(1).max(1000),
});

export type ParsedDailyTask = ValidatedTask & { id?: string };
export type ParseDailyFileResult = { ok: true; tasks: ParsedDailyTask[] } | { ok: false; error: string };

const fail = (error: string): ParseDailyFileResult => ({ ok: false, error });

export function parseDailyFile(text: string): ParseDailyFileResult {
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

  const tasks: ParsedDailyTask[] = [];
  for (const [i, raw] of result.data.tasks.entries()) {
    const checked = validateDailyTask(raw);
    if (!checked.ok) return fail(`Task ${i + 1} ("${raw.title}"): ${checked.error}`);
    tasks.push({ ...checked.data, id: raw.id });
  }
  return { ok: true, tasks };
}
