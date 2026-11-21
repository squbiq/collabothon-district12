// app/(app)/lesson-map/[id]/page.tsx

import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getLesson } from "@/lib/lesson/lesson";
import { getLessonStatus } from "@/lib/lesson/lessons";
import { requireSession } from "@/lib/session";
import { LessonPlayer } from "@/components/feature/lesson/player/lesson-player";

async function LessonContent({ params }: { params: Promise<{ id: string }> }) {
  // lekcje tylko dla zalogowanych – gość trafia na stronę logowania
  const session = await requireSession();
  const { id } = await params;

  // zablokowanej lekcji nie da się otworzyć przez adres – wracamy na mapę, a tam pojawia się tost
  const access = await getLessonStatus(session.user.id, id);
  if (access?.status === "locked") redirect(`/lesson-map?path=${encodeURIComponent(access.topicId)}&locked=1`);
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