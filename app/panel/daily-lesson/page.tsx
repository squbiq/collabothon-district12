// app/panel/daily-lesson/page.tsx
//
// Pula zadań dziennych. Zadanie dnia jest wspólne dla wszystkich: pierwszego dnia bez zadania
// najstarsze z puli dostaje dzisiejszą datę.
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { Plus } from "lucide-react";
import { chunkyButtonVariants } from "@/components/shared/chunky-button";
import { DailyPoolList } from "@/components/feature/daily/admin/daily-pool-list";
import { getDailyPool } from "@/lib/daily/admin-queries";

async function PoolContent() {
  await connection();
  const tasks = await getDailyPool();
  const waiting = tasks.filter((t) => !t.dateKey).length;

  return (
    <>
      <p className="text-sm font-medium text-muted-foreground">
        {tasks.length} task(s), {waiting} waiting in the pool
        {waiting === 0 && tasks.length > 0 ? " – add more so tomorrow has a task" : ""}.
      </p>
      <DailyPoolList tasks={tasks} />
    </>
  );
}

export default function DailyLessonAdminPage() {
  return (
    <div className="flex w-full max-w-3xl min-w-0 flex-col gap-4 px-8 pb-10">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold text-foreground">Daily lessons</h1>
          <p className="font-medium text-muted-foreground">
            Pool of tasks: one correct answer and any number of wrong ones. Every user gets the same task each day.
          </p>
        </div>
        <Link href="/panel/daily-lesson/new" className={chunkyButtonVariants({ tone: "success" })}>
          <Plus /> New task
        </Link>
      </header>
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        <PoolContent />
      </Suspense>
    </div>
  );
}
