// Menu lekcji w panelu admina: lekcja = rozwijana gałąź, dzieci = jej etapy (stage'e).
// W wierszu tytułu są ikonki edycji i usuwania, na końcu gałęzi wiersz "Add Stage".
"use client";

import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import BranchedMenu, { type BranchedMenuItem } from "@/components/@react-bits/BranchedMenu";
import { deleteLesson } from "@/lib/lesson/admin-actions";
import type { LessonTreeItem } from "@/lib/lesson/admin-queries";
import { AddStageDialog } from "./add-stage-dialog";
import { ConfirmDeleteDialog } from "./confirm-dialog";
import { STAGE_ICONS } from "./stage-meta";

const ROUTE_PREFIX = "/panel/lesson";

export function LessonMenu({ lessons }: { lessons: LessonTreeItem[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [addingTo, setAddingTo] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState<{ id: string; title: string } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // /panel/lesson/<lessonId>[/<stageId>] -> który etap jest aktywny i która lekcja rozwinięta
  const [lessonId, stageId] = pathname.startsWith(`${ROUTE_PREFIX}/`)
    ? pathname.slice(ROUTE_PREFIX.length + 1).split("/")
    : [];
  const active = lessonId && stageId ? `stage:${lessonId}:${stageId}` : "";
  const openIndex = lessons.findIndex((l) => l.id === lessonId);

  const items = useMemo<BranchedMenuItem[]>(
    () =>
      lessons.map((lesson) => ({
        value: `lesson:${lesson.id}`,
        label: lesson.title,
        actions: [
          { key: "edit", label: "Edit lesson", icon: <Pencil className="size-4" />, onClick: () => router.push(`${ROUTE_PREFIX}/${lesson.id}`) },
          {
            key: "delete",
            label: "Delete lesson",
            icon: <Trash2 className="size-4" />,
            destructive: true,
            onClick: () => {
              setDeleteError(null);
              setDeleting({ id: lesson.id, title: lesson.title });
            },
          },
        ],
        children: [
          ...lesson.stages.map((stage, i) => ({
            value: `stage:${lesson.id}:${stage.id}`,
            label: `${i + 1}. ${stage.title}`,
            icon: STAGE_ICONS[stage.type],
          })),
          { value: `add:${lesson.id}`, label: "Add Stage", icon: <Plus className="size-4" />, action: true },
        ],
      })),
    [lessons, router]
  );

  function onSelect(value: string) {
    const [kind, lesson, stage] = value.split(":");
    if (kind === "stage") router.push(`${ROUTE_PREFIX}/${lesson}/${stage}`);
    if (kind === "add") setAddingTo(lessons.find((l) => l.id === lesson) ?? null);
  }

  function confirmDelete() {
    if (!deleting) return;
    startTransition(async () => {
      const result = await deleteLesson(deleting.id);
      if (!result.ok) return setDeleteError(result.error);
      // jeśli usunięta lekcja była właśnie otwarta, wracamy na listę
      if (deleting.id === lessonId) router.push(ROUTE_PREFIX);
      setDeleting(null);
    });
  }

  return (
    <>
      {lessons.length === 0 ? (
        <p className="text-sm text-muted-foreground">No lessons yet.</p>
      ) : (
        // Przy wielu lekcjach menu przewija się wewnątrz własnego kontenera.
        <div className="max-h-[calc(100dvh-12rem)] overflow-y-auto pr-2">
          <BranchedMenu
            key={lessons.length}
            items={items}
            active={active}
            defaultOpen={openIndex}
            onSelect={onSelect}
            color="var(--foreground)"
            accentColor="var(--primary)"
            lineColor="var(--muted-foreground)"
            width={272}
            className="w-full!"
          />
        </div>
      )}

      <AddStageDialog lesson={addingTo} onClose={() => setAddingTo(null)} />
      <ConfirmDeleteDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete lesson?"
        description={`“${deleting?.title ?? ""}” and all of its stages will be permanently deleted.`}
        pending={pending}
        error={deleteError}
        onConfirm={confirmDelete}
      />
    </>
  );
}
