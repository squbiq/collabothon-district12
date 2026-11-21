// app/panel/daily-lesson/[id]/page.tsx
import { Suspense } from "react";
import { requireAdmin } from "@/lib/session";
import { redirect } from "next/navigation";
import { DailyTaskForm } from "@/components/feature/daily/admin/daily-task-form";
import { BackToList } from "@/components/feature/daily/admin/back-to-list";
import { getDailyTaskForEdit } from "@/lib/daily/admin-queries";

async function EditContent({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin(); // odczyt sesji = dane żądania (tryb dynamiczny) + kontrola roli
  const { id } = await params;
  const task = await getDailyTaskForEdit(id);
  if (!task) redirect("/panel/daily-lesson");

  return (
    <>
      <header className="flex flex-col gap-1">
        <BackToList />
        <h1 className="text-3xl font-extrabold text-foreground">Edit daily task</h1>
        <p className="font-medium text-muted-foreground">
          {task.dateKey ? `Scheduled for ${task.dateKey}` : "Waiting in the pool"}
          {task.answers > 0 ? ` · ${task.answers} answer(s) so far` : ""}
        </p>
      </header>
      <DailyTaskForm key={task.id} task={task} />
    </>
  );
}

export default function EditDailyTaskPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="flex w-full max-w-2xl min-w-0 flex-col gap-6 px-8 pb-10">
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        <EditContent params={params} />
      </Suspense>
    </div>
  );
}
