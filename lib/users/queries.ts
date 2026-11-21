// lib/users/queries.ts
//
// Lista użytkowników dla panelu admina (wyszukiwanie po e-mailu, nazwie i loginie).
import { prisma } from "@/lib/prisma";
import type { AdminUsersPage } from "./types";

export const USERS_PAGE_SIZE = 20;

export async function getAdminUsers(query: string, page: number): Promise<AdminUsersPage> {
  const q = query.trim().slice(0, 100);
  const where = q
    ? { OR: [{ email: { contains: q } }, { name: { contains: q } }, { username: { contains: q } }] }
    : {};
  const total = await prisma.user.count({ where });
  const lastPage = Math.max(1, Math.ceil(total / USERS_PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), lastPage);

  const rows = await prisma.user.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    skip: (safePage - 1) * USERS_PAGE_SIZE,
    take: USERS_PAGE_SIZE,
    include: { _count: { select: { sessions: true } } },
  });

  return {
    total,
    page: safePage,
    pageSize: USERS_PAGE_SIZE,
    users: rows.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      username: u.username,
      role: u.role ?? "user",
      banned: u.banned,
      banReason: u.banReason,
      banExpires: u.banExpires ? u.banExpires.toISOString() : null,
      experience: u.experience,
      streak: u.streak,
      createdAt: u.createdAt.toISOString(),
      sessionCount: u._count.sessions,
    })),
  };
}
