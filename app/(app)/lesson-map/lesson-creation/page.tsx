// app/(app)/lesson-creation/page.tsx

import { LessonForm } from "@/components/lesson-form";

export default function LessonCreation() {
  return (
    <section className="flex min-h-full w-full justify-center px-4 py-10">
      <div className="flex w-full max-w-2xl flex-col gap-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold text-slate-800">Nowa lekcja</h1>
          <p className="font-medium text-slate-500">
            Uzupełnij dane lekcji i dodaj jej kroki
          </p>
        </header>

        <LessonForm />
      </div>
    </section>
  );
}