// Wybór rozdziału z wybranego tematu + dodawanie nowego rozdziału (input i Enter).
"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createChapter } from "@/lib/lesson/topic-actions";
import type { ChapterOption } from "@/types/lesson-input";
import { FormField } from "./form-field";

type Props = {
  topicId: string;
  chapters: ChapterOption[];
  value: string;
  onChange: (chapterId: string) => void;
};

export function ChapterField({ topicId, chapters, value, onChange }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [newTitle, setNewTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  const options = chapters.filter((c) => c.topicId === topicId);

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault(); // Enter ma dodać rozdział, a nie wysłać cały formularz lekcji
    setError(null);
    startTransition(async () => {
      const result = await createChapter(topicId, newTitle);
      if (!result.ok) return setError(result.error);
      setNewTitle("");
      onChange(result.id);
      router.refresh(); // lista rozdziałów przyjdzie z serwera
    });
  }

  return (
    <>
      <FormField label="Chapter" htmlFor="chapterId">
        <Select
          // items mapuje id -> tytuł, dzięki czemu trigger pokazuje nazwę rozdziału, a nie id
          items={options.map((c) => ({ value: c.id, label: c.title }))}
          value={value}
          onValueChange={(v) => onChange(v ?? "")}
          disabled={!topicId}
        >
          <SelectTrigger id="chapterId" className="w-full">
            <SelectValue placeholder={topicId ? "Select a chapter" : "Select a topic first"} />
          </SelectTrigger>
          <SelectContent>
            {options.map((chapter) => (
              <SelectItem key={chapter.id} value={chapter.id}>
                {chapter.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <FormField label="New chapter" hint="Press Enter to add" htmlFor="newChapter">
        <Input
          id="newChapter"
          value={newTitle}
          disabled={!topicId || pending}
          placeholder="e.g. Chapter 3"
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={onKeyDown}
        />
        {error && <p className="text-xs font-medium text-destructive">{error}</p>}
      </FormField>
    </>
  );
}
