// lib/users/types.ts

export type AdminUserItem = {
  id: string;
  name: string;
  email: string;
  username: string | null;
  role: string;
  banned: boolean;
  banReason: string | null;
  /** ISO; null = ban bezterminowy (gdy banned) */
  banExpires: string | null;
  experience: number;
  streak: number;
  createdAt: string;
  sessionCount: number;
};

export type AdminUsersPage = {
  users: AdminUserItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type ActionResult<T = object> = ({ ok: true } & T) | { ok: false; error: string };
