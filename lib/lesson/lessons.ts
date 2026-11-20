// lib/lesson/lessons.ts

import { prisma } from "@/lib/prisma";
import type { LessonStatus, TopicRoadmapItem } from "@/types/lesson";

// Lista lekcji do mapy tematu.
// Status liczymy tak: ukończone (z UserLessonProgress) -> "completed",
// pierwsza nieukończona -> "active", reszta -> "locked".
// Bez userId nic nie jest ukończone, więc aktywna jest pierwsza lekcja.
export async function getLessons(userId?: string): Promise<TopicRoadmapItem[]> {
  const rows = await prisma.lesson.findMany({
    orderBy: { order: "asc" },
    include: {
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

    return {
      id: row.id,
      order: row.order,
      chapterTitle: row.chapterTitle,
      title: row.title,
      description: row.description,
      estimatedMinutes: row.estimatedMinutes,
      unlockAssetId: row.unlockAssetId,
      targetPersonas: row.targetPersonas.map((p) => p.persona),
      status,
      stepsCount: row._count.steps,
    };
  });
}