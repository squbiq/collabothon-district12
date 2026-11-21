// Wybór rozdziału z wybranego tematu (nowe rozdziały dodaje osobny formularz obok).
"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ChapterOption } from "@/types/lesson-input";
import { FormField } from "./form-field";

type Props = {
  topicId: string;
  chapters: ChapterOption[];
  value: string;
  onChange: (chapterId: string) => void;
};

export function ChapterField({ topicId, chapters, value, onChange }: Props) {
  const options = chapters.filter((c) => c.topicId === topicId);

  return (
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
  );
}
