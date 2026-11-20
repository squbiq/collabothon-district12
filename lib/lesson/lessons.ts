// lib/lesson/lessons.ts

import { prisma } from "@/lib/prisma";
import type { LessonMapItem, LessonStatus } from "@/types/lesson";
import { toLessonBase } from "./mappers";

// Lista lekcji do mapy lekcji.
// Status liczymy tak: ukończone (z UserLessonProgress) -> "completed",
// pierwsza nieukończona -> "active", reszta -> "locked".
// Bez userId nic nie jest ukończone, więc aktywna jest pierwsza lekcja.
export async function getLessons(userId?: string): Promise<LessonMapItem[]> {
  const rows = await prisma.lesson.findMany({
    orderBy: { order: "asc" },
    include: {
      chapter: { select: { orderNumber: true, chapterTitle: true } },
      targetPersonas: true,
      _count: { select: { steps: true } },
      // pusty userId nie pasuje do żadnego wiersza
      progress: { where: { userId: userId ?? "" } },
    },
  });

  let activeAssigned = false;

  return rows.map((row) => {
    const completed = row.progress.some((p) => p.status === "completed");
    let status: LessonStatus;

    if (completed) {
      status = "completed";
    } else if (!activeAssigned) {
      status = "active";
      activeAssigned = true;
    } else {
      status = "locked";
    }

    return { ...toLessonBase(row), chapterTitle: row.chapter.chapterTitle , status, stepsCount: row._count.steps };
  });
}
