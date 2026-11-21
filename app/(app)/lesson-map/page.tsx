// app/(app)/lesson-map/page.tsx
//
// Mapa lekcji: wybór ścieżki na górze + lista lekcji (ukończona / aktywna / zablokowana).
import { Suspense } from "react";
import { resolvePath } from "@/lib/lesson/paths";
import { PathSwitcher } from "@/components/feature/lesson/map/path-switcher";
import { LessonList } from "@/components/feature/lesson/map/lesson-list";
import { CreateLessonLink } from "@/components/feature/lesson/map/create-lesson-link";

type SearchParams = Promise<{ path?: string }>;

async function PathContent({ searchParams }: { searchParams: SearchParams }) {
  const { path } = await searchParams;
  const current = resolvePath(path);

  return (
    <>
      <PathSwitcher currentId={current.id} />
      <LessonList pathId={current.id} />
    </>
  );
}

export default function LessonMapPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <section className="flex min-h-full w-full justify-center px-4 py-10">
      <div className="flex w-full max-w-xl flex-col gap-6">
        <Suspense fallback={<p className="font-bold text-muted-foreground">Loading lessons…</p>}>
          <PathContent searchParams={searchParams} />
          <CreateLessonLink />
        </Suspense>
      </div>
    </section>
  );
}
