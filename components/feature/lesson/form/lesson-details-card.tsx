// Karta z podstawowymi danymi lekcji (rozdział, tytuł, opis, czas, persony...).
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { type ChapterOption } from "@/types/lesson-input";
import type { TopicOption } from "@/lib/lesson/topics";
import { ChapterField } from "./chapter-field";
import { FormField } from "./form-field";
import type { LessonDataFields } from "./lesson-data";

type Props = {
  fields: LessonDataFields;
  topics: TopicOption[];
  chapters: ChapterOption[];
  /** Zmiana tematu czyści wybrany rozdział (rozdziały należą do tematu). */
  onTopicChange: (topicId: string) => void;
  onChange: <K extends keyof LessonDataFields>(key: K, value: LessonDataFields[K]) => void;
};

export function LessonDetailsCard({ fields, topics, chapters, onTopicChange, onChange }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Lesson details</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <FormField label="Topic" htmlFor="topicId">
          <Select
            items={topics.map((t) => ({ value: t.id, label: t.title }))}
            value={fields.topicId}
            onValueChange={(v) => onTopicChange(v ?? "")}
          >
            <SelectTrigger id="topicId" className="w-full">
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

        <ChapterField
          topicId={fields.topicId}
          chapters={chapters}
          value={fields.chapterId}
          onChange={(id) => onChange("chapterId", id)}
        />

        <FormField label="Title" htmlFor="title">
          <Input id="title" required value={fields.title} onChange={(e) => onChange("title", e.target.value)} />
        </FormField>

        <FormField label="Description" htmlFor="description">
          <Textarea
            id="description"
            required
            rows={3}
            value={fields.description}
            onChange={(e) => onChange("description", e.target.value)}
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Estimated time (min)" htmlFor="estimatedMinutes">
            <Input
              id="estimatedMinutes"
              required
              type="number"
              min={1}
              step={1}
              value={fields.estimatedMinutes}
              onChange={(e) => onChange("estimatedMinutes", e.target.value)}
            />
          </FormField>

          <FormField label="Experience" hint="Reward" htmlFor="experience">
            <Input
              id="experience"
              required
              type="number"
              min={0}
              step={1}
              value={fields.experience}
              onChange={(e) => onChange("experience", e.target.value)}
            />
          </FormField>

          <FormField label="Position in list" hint="Empty = keep / put at the end" htmlFor="order">
            <Input
              id="order"
              type="number"
              min={0}
              step={1}
              value={fields.order}
              onChange={(e) => onChange("order", e.target.value)}
            />
          </FormField>
        </div>
      </CardContent>
    </Card>
  );
}
