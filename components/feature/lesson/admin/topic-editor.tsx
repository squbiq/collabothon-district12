// Edycja tematu: nazwa + rozdziały (dodawanie, zmiana nazwy, kolejność, usuwanie).
"use client";

import { useState, useTransition, type FormEvent } from "react";
import { ArrowDown, ArrowUp, Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { ChunkyButton } from "@/components/shared/chunky-button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import {
  createChapter,
  deleteChapter,
  moveChapter,
  renameChapter,
  renameTopic,
} from "@/lib/lesson/topic-actions";
import type { TopicForEdit } from "@/lib/lesson/admin-queries";
import { ConfirmDeleteDialog } from "./confirm-dialog";

type Outcome = { ok: boolean; error?: string };

export function TopicEditor({ topic }: { topic: TopicForEdit }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(topic.title);
  const [newChapter, setNewChapter] = useState("");
  const [editing, setEditing] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState<TopicForEdit["chapters"][number] | null>(null);

  // Wspólna obsługa wyniku akcji: błąd pokazujemy pod listą.
  function run(action: () => Promise<Outcome>, onSuccess?: () => void) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) return setError(result.error ?? "Something went wrong.");
      onSuccess?.();
    });
  }

  function saveTitle(e: FormEvent) {
    e.preventDefault();
    run(() => renameTopic(topic.id, title), () => toast.add({ title: "Topic saved", type: "success" }));
  }

  function addChapter(e: FormEvent) {
    e.preventDefault();
    run(() => createChapter(topic.id, newChapter), () => setNewChapter(""));
  }

  function saveChapter() {
    if (!editing) return;
    run(() => renameChapter(editing.id, editing.title), () => setEditing(null));
  }

  function confirmDelete() {
    if (!deleting) return;
    const id = deleting.id;
    setError(null);
    startTransition(async () => {
      const result = await deleteChapter(id);
      if (!result.ok) return setError(result.error);
      setDeleting(null);
    });
  }

  const last = topic.chapters.length - 1;

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={saveTitle} className="flex items-end gap-2">
        <div className="flex flex-1 flex-col gap-1.5">
          <label htmlFor="topic-title" className="text-sm font-semibold">
            Topic name
          </label>
          <Input id="topic-title" required value={title} disabled={pending} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <ChunkyButton type="submit" tone="success" disabled={pending || title.trim() === topic.title}>
          Save
        </ChunkyButton>
      </form>

      <section className="flex flex-col gap-3" aria-label="Chapters">
        <h2 className="text-xl font-extrabold text-foreground">Chapters</h2>

        <ol className="flex flex-col gap-2">
          {topic.chapters.map((chapter, i) => (
            <li key={chapter.id} className="flex items-center gap-2 rounded-xl border p-2 pl-3">
              <span className="w-6 text-sm font-bold text-muted-foreground">{i + 1}.</span>

              {editing?.id === chapter.id ? (
                <>
                  <Input
                    autoFocus
                    value={editing.title}
                    disabled={pending}
                    aria-label={`Rename ${chapter.title}`}
                    className="h-8"
                    onChange={(e) => setEditing({ id: chapter.id, title: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setEditing(null);
                      if (e.key === "Enter") {
                        e.preventDefault();
                        saveChapter();
                      }
                    }}
                  />
                  <IconButton label="Save" disabled={pending} onClick={saveChapter}>
                    <Check className="size-4" />
                  </IconButton>
                  <IconButton label="Cancel" onClick={() => setEditing(null)}>
                    <X className="size-4" />
                  </IconButton>
                </>
              ) : (
                <>
                  <span className="min-w-0 flex-1 truncate font-medium text-foreground" title={chapter.title}>
                    {chapter.title}
                    <span className="ml-2 text-xs text-muted-foreground">{chapter.lessonCount} lesson(s)</span>
                  </span>
                  <IconButton label="Move up" disabled={pending || i === 0} onClick={() => run(() => moveChapter(chapter.id, "up"))}>
                    <ArrowUp className="size-4" />
                  </IconButton>
                  <IconButton label="Move down" disabled={pending || i === last} onClick={() => run(() => moveChapter(chapter.id, "down"))}>
                    <ArrowDown className="size-4" />
                  </IconButton>
                  <IconButton label="Rename chapter" onClick={() => setEditing({ id: chapter.id, title: chapter.title })}>
                    <Pencil className="size-4" />
                  </IconButton>
                  <IconButton
                    label="Delete chapter"
                    destructive
                    disabled={pending}
                    onClick={() => {
                      setError(null);
                      setDeleting(chapter);
                    }}
                  >
                    <Trash2 className="size-4" />
                  </IconButton>
                </>
              )}
            </li>
          ))}
          {topic.chapters.length === 0 && <li className="text-sm text-muted-foreground">No chapters yet.</li>}
        </ol>

        <form onSubmit={addChapter} className="flex items-center gap-2">
          <Input
            value={newChapter}
            disabled={pending}
            placeholder="New chapter name"
            aria-label="New chapter name"
            onChange={(e) => setNewChapter(e.target.value)}
          />
          <ChunkyButton type="submit" tone="primary" size="sm" disabled={pending || !newChapter.trim()}>
            <Plus /> Add
          </ChunkyButton>
        </form>

        {error && <p className="text-sm font-medium text-destructive">{error}</p>}
      </section>

      <ConfirmDeleteDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete chapter?"
        description={
          deleting && deleting.lessonCount > 0
            ? `“${deleting.title}” still has ${deleting.lessonCount} lesson(s). Delete or move them first.`
            : `“${deleting?.title ?? ""}” will be permanently deleted.`
        }
        pending={pending}
        error={error}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function IconButton({
  label,
  destructive,
  disabled,
  onClick,
  children,
}: {
  label: string;
  destructive?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex size-8 flex-none items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-40 ${destructive ? "hover:text-destructive" : "hover:text-foreground"}`}
    >
      {children}
    </button>
  );
}
