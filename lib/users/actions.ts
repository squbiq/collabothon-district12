// lib/users/actions.ts
//
// Zarządzanie użytkownikami przez plugin admin() better-auth (tylko admin).
// Uprawnienia sprawdza sam plugin na podstawie sesji z nagłówków.
"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import { getSession } from "@/lib/session";
import type { ActionResult } from "./types";

const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });

async function adminSession() {
  const session = await getSession();
  return session?.user.role === "admin" ? session : null;
}

async function run(userId: string, selfAllowed: boolean, fn: () => Promise<unknown>, selfError: string): Promise<ActionResult> {
  const session = await adminSession();
  if (!session) return fail("Forbidden.");
  if (!selfAllowed && session.user.id === userId) return fail(selfError);
  try {
    await fn();
    revalidatePath("/panel/users");
    return { ok: true };
  } catch (e) {
    if (e instanceof APIError) return fail(e.message || "The operation failed.");
    console.error("users action failed", e);
    return fail("The operation failed.");
  }
}

/** Czas trwania bana w sekundach; null = bezterminowo. */
export async function banUser(userId: string, reason: string, durationDays: number | null): Promise<ActionResult> {
  const cleanReason = String(reason ?? "").trim().slice(0, 500);
  if (!cleanReason) return fail("Enter a ban reason.");
  if (durationDays !== null && (!Number.isFinite(durationDays) || durationDays < 1 || durationDays > 3650)) return fail("Invalid ban duration.");
  return run(
    userId,
    false,
    async () =>
      auth.api.banUser({
        headers: await headers(),
        body: { userId, banReason: cleanReason, ...(durationDays ? { banExpiresIn: durationDays * 86_400 } : {}) },
      }),
    "You cannot ban yourself."
  );
}

export async function unbanUser(userId: string): Promise<ActionResult> {
  return run(userId, true, async () => auth.api.unbanUser({ headers: await headers(), body: { userId } }), "");
}

export async function setUserRole(userId: string, role: "user" | "admin"): Promise<ActionResult> {
  if (role !== "user" && role !== "admin") return fail("Invalid role.");
  return run(
    userId,
    false,
    async () => auth.api.setRole({ headers: await headers(), body: { userId, role } }),
    "You cannot change your own role."
  );
}

export async function revokeUserSessions(userId: string): Promise<ActionResult> {
  return run(userId, true, async () => auth.api.revokeUserSessions({ headers: await headers(), body: { userId } }), "");
}

export async function setUserPassword(userId: string, newPassword: string): Promise<ActionResult> {
  if (typeof newPassword !== "string" || newPassword.length < 8 || newPassword.length > 128) {
    return fail("Password must be 8–128 characters long.");
  }
  return run(userId, true, async () => auth.api.setUserPassword({ headers: await headers(), body: { userId, newPassword } }), "");
}

export async function removeUser(userId: string): Promise<ActionResult> {
  return run(
    userId,
    false,
    async () => auth.api.removeUser({ headers: await headers(), body: { userId } }),
    "You cannot delete your own account here."
  );
}
