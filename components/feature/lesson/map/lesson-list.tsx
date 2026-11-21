// Lista lekcji wybranej ścieżki (komponent serwerowy – sam pobiera dane).
import { connection } from "next/server";
import { getLessons } from "@/lib/lesson/lessons";
import type { LessonPathId } from "@/lib/lesson/paths";
import { LessonCard } from "./lesson-card";
import { getSession } from "@/lib/session";

export async function LessonList({ pathId }: { pathId: LessonPathId }) {
  // Dane zależne od żądania (sesja, baza, czas) muszą być pobrane dopiero w request-time.
  // Bez tego Next (cacheComponents) wykonuje zapytanie podczas prerenderu i zgłasza błąd Date.now().
  await connection();
  // useUser() działa tylko w komponentach klienckich, tu sesję bierzemy po stronie serwera.
  const session = await getSession();
  const all = await getLessons(session?.user.id);
  // Lekcje bez pathId pokazują się w każdej ścieżce, dopóki nie uzupełnisz danych.
  const lessons = all.filter((l) => !l.pathId || l.pathId === pathId);

  if (lessons.length === 0) {
    return <p className="font-medium text-muted-foreground">No lessons in this path.</p>;
  }

  return (
    <ul className="flex flex-col gap-4">
      {lessons.map((lesson) => (
        <li key={lesson.id}>
          <LessonCard lesson={lesson} />
        </li>
      ))}
    </ul>
  );
}
