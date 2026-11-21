// lib/lesson/lessons.ts

import { prisma } from "@/lib/prisma";
import type { LessonMapItem, LessonStatus } from "@/types/lesson";
import { toLessonBase } from "./mappers";

/** Status jednej lekcji dla użytkownika (do ochrony trasy odtwarzacza). null = nie ma takiej lekcji. */
export async function getLessonStatus(userId: string, lessonId: string): Promise<{ status: LessonStatus; topicId: string } | null> {
  const lesson = (await getLessons(userId)).find((l) => l.id === lessonId);
  return lesson ? { status: lesson.status, topicId: lesson.topicId } : null;
}

// Lista lekcji do mapy lekcji.
// Status liczymy tak: ukończone (z UserLessonProgress) -> "completed",
// pierwsza nieukończona w danej ścieżce -> "active", reszta -> "locked".
// Bez userId nic nie jest ukończone, więc aktywna jest pierwsza lekcja każdej ścieżki.
export async function getLessons(userId?: string | null): Promise<LessonMapItem[]> {
  const rows = await prisma.lesson.findMany({
    orderBy: { order: "asc" },
    include: {
      chapter: { select: { orderNumber: true, chapterTitle: true, topicId: true } },
      targetPersonas: true,
      _count: { select: { steps: true } },
      // pusty userId nie pasuje do żadnego wiersza
      progress: { where: { userId: userId ?? "" } },
    },
  });

  // Lekcje bez pozycji (order = null) trafiają na koniec listy,
  // żeby nie przejmowały statusu "active" przed właściwą pierwszą lekcją.
  const sorted = [...rows].sort(
    (a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER)
  );

  // Status "active" przyznajemy osobno dla każdej ścieżki (= tematu, czyli temat rozdziału lekcji).
  const pathsWithActive = new Set<string>();

  return sorted.map((row) => {
    const completed = (row.progress ?? []).some((p) => p.status === "completed");
    const pathKey = row.chapter?.topicId ?? "";
    let status: LessonStatus;

    if (completed) {
      status = "completed";
    } else if (!pathsWithActive.has(pathKey)) {
      status = "active";
      pathsWithActive.add(pathKey);
    } else {
      status = "locked";
    }

    return {
      ...toLessonBase(row),
      status,
      stepsCount: row._count?.steps ?? 0,
    };
  });
}