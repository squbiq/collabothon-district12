// lib/users/transfer-parse.ts
//
// Walidacja pliku JSON z importu użytkowników (dane są niezaufane).
import { z } from "zod";
import { USERS_EXPORT_FORMAT, USERS_EXPORT_VERSION } from "@/types/users-transfer";

const id = z.string().trim().min(1).max(191);
const date = z.string().refine((s) => !Number.isNaN(Date.parse(s)), "invalid date");
const nullableDate = date.nullable();
const int = z.number().int().min(0).max(2_000_000_000);

const accountSchema = z.object({
  id,
  accountId: z.string().min(1).max(5000),
  providerId: z.string().min(1).max(200),
  password: z.string().max(5000).nullable().optional(),
  scope: z.string().max(5000).nullable().optional(),
  createdAt: date,
  updatedAt: date,
});

const userSchema = z.object({
  id,
  name: z.string().min(1).max(5000),
  email: z.string().trim().toLowerCase().max(191).pipe(z.email()),
  emailVerified: z.boolean(),
  image: z.string().max(5000).nullable(),
  username: z.string().trim().min(1).max(191).nullable(),
  displayUsername: z.string().max(5000).nullable(),
  role: z.string().max(200).nullable(),
  banned: z.boolean(),
  banReason: z.string().max(5000).nullable(),
  banExpires: nullableDate,
  experience: int,
  streak: int,
  lastStreakUpdate: date,
  createdAt: date,
  updatedAt: date,
  accounts: z.array(accountSchema).max(20).default([]),
  lessonProgress: z
    .array(z.object({ lessonId: id, status: z.enum(["locked", "active", "completed"]), completedAt: nullableDate }))
    .default([]),
  dailyProgress: z.array(z.object({ dailyLessonId: id, selectedOptionId: id, completedAt: date })).default([]),
  arenaDuels: z
    .array(
      z.object({
        id,
        status: z.enum(["in_progress", "finished"]),
        difficulty: z.enum(["easy", "medium", "hard"]),
        questionIds: z.unknown(),
        botPlan: z.unknown(),
        answers: z.unknown(),
        answeredCount: int,
        userScore: int,
        botScore: int,
        xpAwarded: int,
        createdAt: date,
        finishedAt: nullableDate,
      })
    )
    .default([]),
});

const fileSchema = z.object({
  format: z.literal(USERS_EXPORT_FORMAT),
  version: z.literal(USERS_EXPORT_VERSION),
  users: z.array(userSchema).min(1).max(5000),
});

export type ParsedUser = z.infer<typeof userSchema>;
export type ParseUsersFileResult = { ok: true; users: ParsedUser[] } | { ok: false; error: string };

export function parseUsersFile(text: string): ParseUsersFileResult {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: "This file is not valid JSON." };
  }
  const result = fileSchema.safeParse(json);
  if (!result.success) {
    const issue = result.error.issues[0];
    return { ok: false, error: `Invalid file (${issue.path.map(String).join(".") || "root"}): ${issue.message}` };
  }

  const ids = new Set<string>();
  const emails = new Set<string>();
  const usernames = new Set<string>();
  for (const u of result.data.users) {
    const uname = u.username?.toLowerCase();
    if (ids.has(u.id) || emails.has(u.email) || (uname && usernames.has(uname))) {
      return { ok: false, error: `Duplicate user in the file: ${u.email}.` };
    }
    ids.add(u.id);
    emails.add(u.email);
    if (uname) usernames.add(uname);
  }
  return { ok: true, users: result.data.users };
}
