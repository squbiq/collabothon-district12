// app/panel/lesson/topic/[id]/page.tsx
//
// Edycja tematu: nazwa oraz rozdziały (dodawanie, zmiana nazwy, kolejność, usuwanie).
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getTopicForEdit } from "@/lib/lesson/admin-queries";
import { TopicEditor } from "@/components/feature/lesson/admin/topic-editor";

async function TopicContent({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const topic = await getTopicForEdit(id);
  // brak tematu (np. właśnie usunięty) -> wracamy na listę
  if (!topic) redirect("/panel/lesson");

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-foreground">Edit topic</h1>
        <p className="font-medium text-muted-foreground">{topic.title}</p>
      </header>
      {/* key: po zmianie nazwy / przejściu na inny temat formularz startuje z aktualnych danych */}
      <TopicEditor key={`${topic.id}:${topic.title}`} topic={topic} />
    </div>
  );
}

export default function EditTopicPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
      <TopicContent params={params} />
    </Suspense>
  );
}
