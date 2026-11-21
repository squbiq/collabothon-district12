// Osobny formularz dodawania rozdziału (obok formularza lekcji): temat + nazwa, Enter lub przycisk.
"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { ChunkyButton } from "@/components/shared/chunky-button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField } from "@/components/feature/lesson/form/form-field";
import { createChapter } from "@/lib/lesson/topic-actions";
import type { TopicOption } from "@/lib/lesson/topics";

type Message = { kind: "ok" | "error"; text: string };

export function ChapterCreateForm({ topics }: { topics: TopicOption[] }) {
  const [pending, startTransition] = useTransition();
  const [topicId, setTopicId] = useState(topics[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState<Message | null>(null);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const result = await createChapter(topicId, title);
      if (!result.ok) return setMessage({ kind: "error", text: result.error });
      setTitle("");
      // lista rozdziałów w formularzu lekcji odświeża się razem z widokiem (akcja wywołuje refresh)
      setMessage({ kind: "ok", text: "Chapter added. You can select it in the lesson form." });
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 rounded-2xl border-2 p-4" aria-label="New chapter">
      <h2 className="text-lg font-extrabold text-foreground">New chapter</h2>

      <FormField label="Topic" htmlFor="newChapterTopic">
        <Select
          items={topics.map((t) => ({ value: t.id, label: t.title }))}
          value={topicId}
          onValueChange={(v) => setTopicId(v ?? "")}
        >
          <SelectTrigger id="newChapterTopic" className="w-full">
            <SelectValue placeholder="Select a topic" />
          </SelectTrigger>
          <SelectContent>
            {topics.map((topic) => (
              <SelectItem key={topic.id} value={topic.id}>
                {topic.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <FormField label="Chapter name" htmlFor="newChapterTitle">
        <Input
          id="newChapterTitle"
          value={title}
          placeholder="e.g. Chapter 3"
          onChange={(e) => setTitle(e.target.value)}
        />
      </FormField>

      <ChunkyButton type="submit" tone="success" size="sm" fullWidth disabled={pending || !topicId || !title.trim()}>
        <Plus /> Add chapter
      </ChunkyButton>

      {message && (
        <p role="status" className={`text-xs font-medium ${message.kind === "error" ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"}`}>
          {message.text}
        </p>
      )}
    </form>
  );
}
