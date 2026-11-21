// lib/home.ts
//
// Dane strony głównej (tylko serwer). Wywołuj po odczycie sesji – wtedy zegar jest dozwolony.
import "server-only";
import { prisma } from "@/lib/prisma";
import { currentTime } from "@/lib/clock";
import { getEffectiveStreak, isStreakDoneToday, utcDayIndex } from "@/components/streak/streak";
import { getTodayMission } from "@/lib/daily/queries";
import { getLessons } from "@/lib/lesson/lessons";

export type WeekDay = { label: string; active: boolean; today: boolean };

// Ostatnie 7 dni (UTC) z zaznaczonymi dniami serii: seria kończy się w dniu lastStreakUpdate.
function buildWeek(streak: number, lastStreakUpdate: Date, now: Date): WeekDay[] {
  const today = utcDayIndex(now);
  const last = utcDayIndex(lastStreakUpdate);
  const labels = ["S", "M", "T", "W", "T", "F", "S"];
  return Array.from({ length: 7 }, (_, i) => {
    const day = today - 6 + i;
    return {
      label: labels[new Date(day * 86_400_000).getUTCDay()],
      active: streak > 0 && day <= last && day > last - streak,
      today: day === today,
    };
  });
}

export async function getHomeData(userId?: string) {
  const now = await currentTime();
  const [mission, lessons, user] = await Promise.all([
    getTodayMission(userId),
    getLessons(userId),
    userId
      ? prisma.user.findUnique({
          where: { id: userId },
          select: { name: true, username: true, displayUsername: true, experience: true, streak: true, lastStreakUpdate: true },
        })
      : null,
  ]);

  const completedLessons = lessons.filter((l) => l.status === "completed").length;
  const nextLesson = lessons.find((l) => l.status === "active") ?? null;

  const streakState = user && { streak: user.streak, lastStreakUpdate: user.lastStreakUpdate };
  return {
    mission,
    totalLessons: lessons.length,
    completedLessons,
    nextLesson,
    user: user && {
      name: user.displayUsername ?? user.username ?? user.name,
      xp: user.experience,
      streak: getEffectiveStreak(streakState!, now),
      doneToday: isStreakDoneToday(streakState!, now),
      week: buildWeek(getEffectiveStreak(streakState!, now), user.lastStreakUpdate, now),
    },
  };
}
