// app/(app)/lesson-map/page.tsx
//
// Mapa lekcji: wybór tematu na górze + lekcje pogrupowane po rozdziałach.
import { Suspense } from "react";
import { connection } from "next/server";
import { getTopics, resolveTopic } from "@/lib/lesson/topics";
import { PathSwitcher } from "@/components/feature/lesson/map/path-switcher";
import { LessonList } from "@/components/feature/lesson/map/lesson-list";
import { CreateLessonLink } from "@/components/feature/lesson/map/create-lesson-link";

type SearchParams = Promise<{ path?: string }>;

async function PathContent({ searchParams }: { searchParams: SearchParams }) {
  const { path } = await searchParams;
  await connection();
  const topics = await getTopics();
  const current = resolveTopic(topics, path);

  if (!current) {
    return <p className="font-medium text-muted-foreground">No topics yet.</p>;
  }

  return (
    <>
      <PathSwitcher topics={topics} currentId={current.id} />
      <LessonList topicId={current.id} />
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
