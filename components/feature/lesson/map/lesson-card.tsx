// Karta pojedynczej lekcji na mapie lekcji (czysta prezentacja, bez pobierania danych).
import { ChunkyCard } from "@/components/shared/chunky-card";
import { cn } from "@/lib/utils";
import type { LessonMapItem } from "@/types/lesson";
import { LESSON_STATUS_META } from "./lesson-status";

export function LessonCard({ lesson, disabled = false }: { lesson: LessonMapItem; disabled?: boolean }) {
  const meta = LESSON_STATUS_META[lesson.status];

  return (
    <ChunkyCard tone={meta.tone} href={`/lesson-map/${lesson.id}`} disabled={disabled}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-extrabold">{lesson.title}</h2>
          <p className={meta.muted}>{lesson.description}</p>
          <p className={cn("mt-1 text-sm font-bold", meta.muted)}>
            {lesson.estimatedMinutes} min · {lesson.stepsCount} steps
          </p>
        </div>
        <span className={cn("shrink-0 rounded-xl px-3 py-1 text-sm font-bold", meta.badge)}>
          {meta.label}
        </span>
      </div>
    </ChunkyCard>
  );
}
