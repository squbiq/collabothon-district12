// Grupa lekcji z jednego rozdziału: nagłówek (chapterTitle) + karty lekcji.
import type { LessonMapItem } from "@/types/lesson";
import { LessonCard } from "./lesson-card";

type Props = {
  title: string;
  lessons: LessonMapItem[];
  /** Gość: karty są wyszarzone i nie prowadzą do lekcji. */
  locked: boolean;
};

export function LessonChapterGroup({ title, lessons, locked }: Props) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-extrabold text-muted-foreground">{title}</h2>
      <ul className="flex flex-col gap-4">
        {lessons.map((lesson) => (
          <li key={lesson.id}>
            <LessonCard lesson={locked ? { ...lesson, status: "locked" } : lesson} disabled={locked} />
          </li>
        ))}
      </ul>
    </section>
  );
}
