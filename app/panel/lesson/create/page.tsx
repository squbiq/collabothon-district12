// app/panel/lesson/create/page.tsx
//
// Tworzenie lekcji – nowa lekcja trafia do menu od razu z jednym domyślnym etapem.
import { Suspense } from "react";
import { getChapterOptions } from "@/lib/lesson/admin-queries";
import { LessonDataForm } from "@/components/feature/lesson/admin/lesson-data-form";

async function CreateLessonContent() {
  const chapters = await getChapterOptions();
  return <LessonDataForm chapters={chapters} />;
}

export default function LessonCreatePage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-foreground">New lesson</h1>
        <p className="font-medium text-muted-foreground">
          Fill in the lesson details. It will be created with one default stage that you can edit next.
        </p>
      </header>
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        <CreateLessonContent />
      </Suspense>
    </div>
  );
}
