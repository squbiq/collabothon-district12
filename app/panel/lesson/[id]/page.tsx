// app/panel/lesson/[id]/page.tsx
//
// Edycja danych lekcji (ten sam formularz co przy tworzeniu, ale wypełniony).
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getChapterOptions, getLessonForEdit } from "@/lib/lesson/admin-queries";
import { LessonDataForm } from "@/components/feature/lesson/admin/lesson-data-form";

async function EditLessonContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [lesson, chapters] = await Promise.all([getLessonForEdit(id), getChapterOptions()]);
  if (!lesson) notFound();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-foreground">Edit lesson</h1>
        <p className="font-medium text-muted-foreground">{lesson.title}</p>
      </header>
      {/* key: przy przejściu na inną lekcję formularz startuje od nowa */}
      <LessonDataForm key={lesson.id} lesson={lesson} chapters={chapters} />
    </div>
  );
}

export default function EditLessonPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
      <EditLessonContent params={params} />
    </Suspense>
  );
}
