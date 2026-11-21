// lib/profile/actions.ts
//
// Eksport własnych danych użytkownika do pliku JSON (bez haseł, tokenów i sesji).
"use server";

import { currentTime, utcDateKey } from "@/lib/clock";
import { getSession } from "@/lib/session";
import { loadExportedUsers } from "@/lib/users/export-data";
import { USERS_EXPORT_FORMAT, USERS_EXPORT_VERSION, type UsersExportFile } from "@/types/users-transfer";

export async function exportMyData(): Promise<{ ok: true; json: string; filename: string } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "You have to be logged in." };

  try {
    const users = await loadExportedUsers({ ids: [session.user.id], includePasswords: false });
    const file: UsersExportFile = { format: USERS_EXPORT_FORMAT, version: USERS_EXPORT_VERSION, users };
    const date = utcDateKey(await currentTime());
    return { ok: true, json: JSON.stringify(file, null, 2), filename: `my-data-${date}.json` };
  } catch (e) {
    console.error("exportMyData failed", e);
    return { ok: false, error: "Could not export your data." };
  }
}
