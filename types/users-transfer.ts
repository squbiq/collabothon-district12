// types/users-transfer.ts
//
// Format pliku JSON do eksportu/importu użytkowników (panel admina) i eksportu własnych danych (profil).

export const USERS_EXPORT_FORMAT = "users-export";
export const USERS_EXPORT_VERSION = 1;

export type ExportedAccount = {
  id: string;
  accountId: string;
  providerId: string;
  /** Hash hasła (tylko eksport admina z opcją „z hasłami"). */
  password?: string | null;
  scope?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ExportedUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  username: string | null;
  displayUsername: string | null;
  role: string | null;
  banned: boolean;
  banReason: string | null;
  banExpires: string | null;
  experience: number;
  streak: number;
  lastStreakUpdate: string;
  createdAt: string;
  updatedAt: string;
  accounts: ExportedAccount[];
  lessonProgress: { lessonId: string; status: "locked" | "active" | "completed"; completedAt: string | null }[];
  dailyProgress: { dailyLessonId: string; selectedOptionId: string; completedAt: string }[];
  arenaDuels: {
    id: string;
    status: "in_progress" | "finished";
    difficulty: "easy" | "medium" | "hard";
    questionIds: unknown;
    botPlan: unknown;
    answers: unknown;
    answeredCount: number;
    userScore: number;
    botScore: number;
    xpAwarded: number;
    createdAt: string;
    finishedAt: string | null;
  }[];
};

export type UsersExportFile = {
  format: typeof USERS_EXPORT_FORMAT;
  version: typeof USERS_EXPORT_VERSION;
  users: ExportedUser[];
};
