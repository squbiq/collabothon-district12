// Lista lekcji wybranego tematu, pogrupowana po rozdziałach (komponent serwerowy – sam pobiera dane).
import { getLessons } from "@/lib/lesson/lessons";
import { getSession } from "@/lib/session";
import type { LessonMapItem } from "@/types/lesson";
import { LessonChapterGroup } from "./lesson-chapter-group";
import { LoginRequiredNotice } from "./login-required-notice";

// Grupuje po chapterTitle; rozdziały w kolejności numerów, lekcje wg kolejności z bazy.
function groupByChapter(lessons: LessonMapItem[]) {
  const groups = new Map<string, { number: number; lessons: LessonMapItem[] }>();
  for (const lesson of lessons) {
    const key = lesson.chapterTitle || "Other lessons";
    const group = groups.get(key) ?? { number: lesson.chapterNumber, lessons: [] };
    group.number = Math.min(group.number, lesson.chapterNumber);
    group.lessons.push(lesson);
    groups.set(key, group);
  }
  return [...groups.entries()]
    .sort(([, a], [, b]) => a.number - b.number)
    .map(([title, group]) => ({ title, lessons: group.lessons }));
}

export async function LessonList({ topicId }: { topicId: string }) {
  // getSession() czyta nagłówki żądania – dalsze dane są pobierane w trybie dynamicznym (cacheComponents).
  const session = await getSession();
  const isLoggedIn = Boolean(session);

  const all = await getLessons(session?.user.id);
  const lessons = all.filter((l) => l.topicId === topicId);
  const groups = groupByChapter(lessons);

  return (
    <>
      {!isLoggedIn && <LoginRequiredNotice />}

      {groups.length === 0 ? (
        <p className="font-medium text-muted-foreground">No lessons in this topic.</p>
      ) : (
        <div className="flex flex-col gap-8">
          {groups.map((group) => (
            <LessonChapterGroup key={group.title} title={group.title} lessons={group.lessons} locked={!isLoggedIn} />
          ))}
        </div>
      )}
    </>
  );
}
