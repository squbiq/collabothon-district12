// Edytor tematów: input + Enter dodaje temat, ołówek zmienia nazwę, kosz usuwa (tylko pusty temat).
"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type KeyboardEvent } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { createTopic, deleteTopic, renameTopic } from "@/lib/lesson/topic-actions";
import type { TopicOption } from "@/lib/lesson/topics";

export function TopicsEditor({ topics }: { topics: TopicOption[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [newTitle, setNewTitle] = useState("");
  const [editing, setEditing] = useState<{ id: string; title: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Wspólna obsługa wyniku akcji: błąd pokazujemy pod listą, sukces odświeża dane.
  function run(action: () => Promise<{ ok: boolean; error?: string }>, onSuccess?: () => void) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) return setError(result.error ?? "Something went wrong.");
      onSuccess?.();
      router.refresh();
    });
  }

  function onAddKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    run(() => createTopic(newTitle), () => setNewTitle(""));
  }

  function onEditKey(e: KeyboardEvent<HTMLInputElement>) {
    if (!editing) return;
    if (e.key === "Escape") return setEditing(null);
    if (e.key !== "Enter") return;
    e.preventDefault();
    run(() => renameTopic(editing.id, editing.title), () => setEditing(null));
  }

  return (
    <section className="flex flex-col gap-2 rounded-2xl border p-3" aria-label="Topics">
      <h2 className="text-sm font-extrabold text-foreground">Topics</h2>

      <Input
        value={newTitle}
        disabled={pending}
        placeholder="New topic (press Enter)"
        aria-label="New topic name"
        onChange={(e) => setNewTitle(e.target.value)}
        onKeyDown={onAddKey}
      />

      {/* Przy wielu tematach lista przewija się w swoim kontenerze. */}
      <ul className="flex max-h-48 flex-col gap-1 overflow-y-auto">
        {topics.map((topic) => (
          <li key={topic.id} className="flex items-center gap-1">
            {editing?.id === topic.id ? (
              <>
                <Input
                  autoFocus
                  value={editing.title}
                  disabled={pending}
                  aria-label={`Rename ${topic.title}`}
                  className="h-7"
                  onChange={(e) => setEditing({ id: topic.id, title: e.target.value })}
                  onKeyDown={onEditKey}
                />
                <IconButton label="Save" onClick={() => run(() => renameTopic(topic.id, editing.title), () => setEditing(null))}>
                  <Check className="size-4" />
                </IconButton>
                <IconButton label="Cancel" onClick={() => setEditing(null)}>
                  <X className="size-4" />
                </IconButton>
              </>
            ) : (
              <>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground" title={topic.title}>
                  {topic.title}
                </span>
                <IconButton label="Rename topic" onClick={() => setEditing({ id: topic.id, title: topic.title })}>
                  <Pencil className="size-4" />
                </IconButton>
                <IconButton label="Delete topic" destructive disabled={pending} onClick={() => run(() => deleteTopic(topic.id))}>
                  <Trash2 className="size-4" />
                </IconButton>
              </>
            )}
          </li>
        ))}
        {topics.length === 0 && <li className="text-sm text-muted-foreground">No topics yet.</li>}
      </ul>

      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </section>
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
      className={`inline-flex size-7 flex-none items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50 ${destructive ? "hover:text-destructive" : "hover:text-foreground"}`}
    >
      {children}
    </button>
  );
}
