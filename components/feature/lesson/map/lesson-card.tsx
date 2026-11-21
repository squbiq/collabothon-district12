// Karta pojedynczej lekcji na mapie lekcji (bez pobierania danych).
// Zablokowana lekcja nie jest linkiem – kliknięcie pokazuje tost z wyjaśnieniem.
"use client";

import type { KeyboardEvent } from "react";
import { ChunkyCard } from "@/components/shared/chunky-card";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { LessonMapItem } from "@/types/lesson";
import { LESSON_STATUS_META } from "./lesson-status";

export function showLockedLessonToast(guest: boolean) {
  toast.add(
    guest
      ? { title: "Sign in to open lessons", description: "Lessons are available to logged-in users.", type: "info" }
      : { title: "This lesson is locked", description: "Finish the previous lesson in this path to unlock it.", type: "warning" }
  );
}

/** `disabled` = gość (karty są wyszarzone); lekcje ze statusem "locked" są zablokowane również dla zalogowanych. */
export function LessonCard({ lesson, disabled = false }: { lesson: LessonMapItem; disabled?: boolean }) {
  const meta = LESSON_STATUS_META[lesson.status];
  const blocked = disabled || lesson.status === "locked";

  const onBlockedKey = (event: KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      showLockedLessonToast(disabled);
    }
  };

  return (
    <ChunkyCard
      tone={meta.tone}
      href={blocked ? undefined : `/lesson-map/${lesson.id}`}
      disabled={blocked}
      {...(blocked ? { role: "button", tabIndex: 0, onClick: () => showLockedLessonToast(disabled), onKeyDown: onBlockedKey } : {})}
    >
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
