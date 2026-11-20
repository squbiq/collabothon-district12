// app/(app)/lesson-map/page.tsx
//
// Mapa lekcji: wybór ścieżki na górze + lista lekcji (ukończona / aktywna / zablokowana).
import Link from "next/link";
import { Suspense } from "react";
import { getLessons } from "@/lib/lesson/lessons";
import { resolvePath } from "@/lib/lesson/paths";
import { PathSwitcher } from "@/components/path-switcher";
import type { LessonStatus } from "@/types/lesson";

const styles: Record<
  LessonStatus,
  { card: string; muted: string; badge: string; label: string }
> = {
  completed: {
    card: "bg-green-500 border-green-700 text-white",
    muted: "text-white/90",
    badge: "bg-white/20 text-white",
    label: "Ukończona",
  },
  active: {
    card: "bg-sky-500 border-sky-700 text-white",
    muted: "text-white/90",
    badge: "bg-white/20 text-white",
    label: "Zacznij",
  },
  locked: {
    card: "bg-slate-200 border-slate-300 text-slate-500",
    muted: "text-slate-500",
    badge: "bg-slate-300 text-slate-600",
    label: "Zablokowana",
  },
};

async function LessonList({ pathId }: { pathId: string }) {
  const all = await getLessons(); // TODO: przekaż id zalogowanego użytkownika
  // Lekcje bez pathId pokazują się w każdej ścieżce, dopóki nie uzupełnisz danych.
  const lessons = all.filter((l) => !l.pathId || l.pathId === pathId);

  if (lessons.length === 0) {
    return <p className="font-medium text-muted-foreground">Brak lekcji w tej ścieżce.</p>;
  }

  return (
    <ul className="flex flex-col gap-4">
      {lessons.map((lesson) => {
        const s = styles[lesson.status];
        return (
          <li key={lesson.id}>
            <Link
              href={`/lesson-map/${lesson.id}`}
              className={`block w-full rounded-2xl border-2 border-b-[6px] p-5 transition-transform duration-75 hover:brightness-105 active:translate-y-[4px] active:border-b-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-300 ${s.card}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <p className={`text-sm font-bold ${s.muted}`}>{lesson.chapterTitle}</p>
                  <h2 className="text-xl font-extrabold">{lesson.title}</h2>
                  <p className={s.muted}>{lesson.description}</p>
                  <p className={`mt-1 text-sm font-bold ${s.muted}`}>
                    {lesson.estimatedMinutes} min · {lesson.stepsCount} kroków
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-xl px-3 py-1 text-sm font-bold ${s.badge}`}
                >
                  {s.label}
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

async function PathContent({
  searchParams,
}: {
  searchParams: Promise<{ path?: string }>;
}) {
  const { path } = await searchParams;
  const current = resolvePath(path);

  return (
    <>
      <PathSwitcher currentId={current.id} />
      <LessonList pathId={current.id} />
    </>
  );
}

export default function LessonMapPage({
  searchParams,
}: {
  searchParams: Promise<{ path?: string }>;
}) {
  return (
    <section className="flex min-h-full w-full justify-center px-4 py-10">
      <div className="flex w-full max-w-xl flex-col gap-6">
        <Suspense
          fallback={<p className="font-bold text-muted-foreground">Ładowanie lekcji…</p>}
        >
          <PathContent searchParams={searchParams} />
        </Suspense>
      </div>
    </section>
  );
}