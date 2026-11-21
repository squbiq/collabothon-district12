// Lista puli zadań dziennych: edycja i usuwanie (z potwierdzeniem).
"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ConfirmDeleteDialog } from "@/components/feature/lesson/admin/confirm-dialog";
import { deleteDailyTask } from "@/lib/daily/admin-actions";
import type { DailyTaskListItem } from "@/lib/daily/admin-types";

export function DailyPoolList({ tasks }: { tasks: DailyTaskListItem[] }) {
  const [pending, startTransition] = useTransition();
  const [deleting, setDeleting] = useState<DailyTaskListItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  function confirmDelete() {
    if (!deleting) return;
    startTransition(async () => {
      const result = await deleteDailyTask(deleting.id);
      if (!result.ok) return setError(result.error);
      setDeleting(null);
    });
  }

  if (tasks.length === 0) return <p className="text-muted-foreground">The pool is empty. Add the first task.</p>;

  return (
    <>
      <ul className="flex flex-col gap-2">
        {tasks.map((task) => (
          <li key={task.id} className="flex items-center gap-3 rounded-xl border p-3">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="truncate font-bold text-foreground" title={task.title}>
                {task.title}
              </span>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary">{task.category}</Badge>
                <span>{task.optionCount} options</span>
                <span>+{task.rewardExp} XP</span>
                {task.dateKey ? <Badge variant="outline">Scheduled: {task.dateKey}</Badge> : <Badge>In pool</Badge>}
              </div>
            </div>
            <Link
              href={`/panel/daily-lesson/${task.id}`}
              title="Edit task"
              aria-label="Edit task"
              className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Pencil className="size-4" />
            </Link>
            <button
              type="button"
              title="Delete task"
              aria-label="Delete task"
              className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive"
              onClick={() => {
                setError(null);
                setDeleting(task);
              }}
            >
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
      </ul>

      <ConfirmDeleteDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete task?"
        description={`“${deleting?.title ?? ""}” will be permanently deleted${
          deleting && deleting.answers > 0 ? `, together with ${deleting.answers} user answer(s)` : ""
        }.`}
        pending={pending}
        error={error}
        onConfirm={confirmDelete}
      />
    </>
  );
}
