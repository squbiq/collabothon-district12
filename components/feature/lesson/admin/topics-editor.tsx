// Edytor tematów: input + Enter dodaje temat, ołówek otwiera stronę tematu (nazwa i rozdziały), kosz usuwa (tylko pusty temat).
"use client";

import { useState, useTransition, type KeyboardEvent } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { createTopic, deleteTopic } from "@/lib/lesson/topic-actions";
import type { TopicOption } from "@/lib/lesson/topics";

export function TopicsEditor({ topics }: { topics: TopicOption[] }) {
  const [pending, startTransition] = useTransition();
  const [newTitle, setNewTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Wspólna obsługa wyniku akcji: błąd pokazujemy pod listą, sukces odświeża dane.
  function run(action: () => Promise<{ ok: boolean; error?: string }>, onSuccess?: () => void) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) return setError(result.error ?? "Something went wrong.");
      onSuccess?.();
    });
  }

  function onAddKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    run(() => createTopic(newTitle), () => setNewTitle(""));
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
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground" title={topic.title}>
              {topic.title}
            </span>
            <Link
              href={`/panel/lesson/topic/${topic.id}`}
              title="Edit topic and chapters"
              aria-label="Edit topic and chapters"
              className="inline-flex size-7 flex-none items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <Pencil className="size-4" />
            </Link>
            <IconButton label="Delete topic" destructive disabled={pending} onClick={() => run(() => deleteTopic(topic.id))}>
              <Trash2 className="size-4" />
            </IconButton>
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
