// app/(app)/lesson-map/[id]/page.tsx

import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getLesson } from "@/lib/lesson/lesson";
import { LessonPlayer } from "@/components/feature/lesson/player/lesson-player";

async function LessonContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lesson = await getLesson(id);

  if (!lesson) notFound();

  return <LessonPlayer lesson={lesson} />;
}

export default function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={
      <p className="w-full py-20 text-center font-bold text-muted-foreground">
        Loading lesson…
      </p>
    }>
      <LessonContent params={params} />
    </Suspense>
  );
}