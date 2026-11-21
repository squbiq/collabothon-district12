// app/panel/lesson/[id]/page.tsx
//
// Edycja danych lekcji (ten sam formularz co przy tworzeniu, ale wypełniony).
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getTopics } from "@/lib/lesson/topics";
import { getChapterOptions, getLessonForEdit } from "@/lib/lesson/admin-queries";
import { LessonDataForm } from "@/components/feature/lesson/admin/lesson-data-form";
import { connection } from "next/server";

async function EditLessonContent({ params }: { params: Promise<{ id: string }> }) {
  await connection()
  const { id } = await params;
  const [lesson, topics, chapters] = await Promise.all([getLessonForEdit(id), getTopics(), getChapterOptions()]);
  // brak lekcji (np. właśnie usunięta) -> wracamy na listę, zamiast pokazywać 404
  if (!lesson) redirect("/panel/lesson");

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-foreground">Edit lesson</h1>
        <p className="font-medium text-muted-foreground">{lesson.title}</p>
      </header>
      {/* key: przy przejściu na inną lekcję formularz startuje od nowa */}
      <LessonDataForm key={lesson.id} lesson={lesson} topics={topics} chapters={chapters} />
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
