import "server-only";
import { prisma } from "@/lib/prisma";

const TOP = 20;

export type RankingEntry = {
  userId: string;
  name: string;
  value: number;
  rank: number;
  isMe: boolean;
};

export type Ranking = {
  top: RankingEntry[];
  me: RankingEntry | null; // pozycja zalogowanego, jeśli jest poza topką
};

export type Rankings = {
  lessons: Ranking;
  streak: Ranking;
  xp: Ranking;
};

type Row = { userId: string; name: string; value: number };

function displayName(u: {
  name: string;
  username: string | null;
  displayUsername: string | null;
}) {
  return u.displayUsername ?? u.username ?? u.name;
}

// Remisy dostają to samo miejsce (1, 2, 2, 4...).
function buildRanking(rows: Row[], meId?: string): Ranking {
  const sorted = [...rows].sort(
    (a, b) => b.value - a.value || a.name.localeCompare(b.name)
  );

  let prevValue: number | null = null;
  let prevRank = 0;

  const all: RankingEntry[] = sorted.map((row, i) => {
    const rank = row.value === prevValue ? prevRank : i + 1;
    prevValue = row.value;
    prevRank = rank;
    return { ...row, rank, isMe: row.userId === meId };
  });

  const top = all.slice(0, TOP);
  const me = all.find((e) => e.isMe);

  return { top, me: me && !top.some((e) => e.isMe) ? me : null };
}

export async function getRankings(meId?: string): Promise<Rankings> {
  const userSelect = {
    id: true,
    name: true,
    username: true,
    displayUsername: true,
  } as const;

  const [lessonGroups, streakUsers, xpUsers] = await Promise.all([
    // 1) ukończone lekcje
    prisma.userLessonProgress.groupBy({
      by: ["userId"],
      where: { status: "completed", user: { banned: false } },
      _count: { _all: true },
    }),

    // 2) aktualny streak
    prisma.user.findMany({
      where: { banned: false, streak: { gt: 0 } },
      select: { ...userSelect, streak: true },
    }),

    // 3) total xp
    prisma.user.findMany({
      where: { banned: false, experience: { gt: 0 } },
      select: { ...userSelect, experience: true },
    }),
  ]);

  const lessonUsers = lessonGroups.length
    ? await prisma.user.findMany({
        where: { id: { in: lessonGroups.map((g) => g.userId) } },
        select: userSelect,
      })
    : [];
  const lessonUserById = new Map(lessonUsers.map((u) => [u.id, u]));

  const lessonRows: Row[] = lessonGroups.flatMap((g) => {
    const u = lessonUserById.get(g.userId);
    return u
      ? [{ userId: u.id, name: displayName(u), value: g._count._all }]
      : [];
  });

  return {
    lessons: buildRanking(lessonRows, meId),
    streak: buildRanking(
      streakUsers.map((u) => ({
        userId: u.id,
        name: displayName(u),
        value: u.streak,
      })),
      meId
    ),
    xp: buildRanking(
      xpUsers.map((u) => ({
        userId: u.id,
        name: displayName(u),
        value: u.experience,
      })),
      meId
    ),
  };
}