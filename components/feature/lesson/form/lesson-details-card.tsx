// Karta z podstawowymi danymi lekcji (rozdział, tytuł, opis, czas, persony...).
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PERSONAS, type ChapterOption } from "@/types/lesson-input";
import type { PersonaType } from "@/types/users";
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
  onTogglePersona: (p: PersonaType) => void;
};

export function LessonDetailsCard({ fields, topics, chapters, onTopicChange, onChange, onTogglePersona }: Props) {
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

        <div className="grid gap-4 sm:grid-cols-2">
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

        <FormField label="Asset ID to unlock" hint="Optional" htmlFor="unlockAssetId">
          <Input id="unlockAssetId" value={fields.unlockAssetId} onChange={(e) => onChange("unlockAssetId", e.target.value)} />
        </FormField>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-semibold">Target audience</legend>
          <div className="flex flex-wrap gap-3">
            {PERSONAS.map((p) => {
              const id = `persona-${p}`;
              return (
                <Label
                  key={p}
                  htmlFor={id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border px-3.5 py-2 font-medium transition-colors hover:bg-muted/50"
                >
                  <Checkbox id={id} checked={fields.personas.includes(p)} onCheckedChange={() => onTogglePersona(p)} />
                  {p}
                </Label>
              );
            })}
          </div>
        </fieldset>
      </CardContent>
    </Card>
  );
}
