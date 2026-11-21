// Formularz danych lekcji – tryb "create" (nowa lekcja) i "edit" (wypełniony danymi).
"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { AlertCircle } from "lucide-react";
import { ChunkyButton } from "@/components/shared/chunky-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/components/ui/toast";
import { createLessonWithStage, saveLessonData } from "@/lib/lesson/admin-actions";
import type { ChapterOption, LessonDataInput } from "@/types/lesson-input";
import type { PersonaType } from "@/types/users";
import { LessonDetailsCard } from "@/components/feature/lesson/form/lesson-details-card";
import {
  emptyLessonData,
  fromLessonData,
  toLessonDataInput,
  type LessonDataFields,
} from "@/components/feature/lesson/form/lesson-data";

type Props = {
  chapters: ChapterOption[];
  /** Brak = tworzenie nowej lekcji, podane = edycja istniejącej. */
  lesson?: LessonDataInput & { id: string };
};

export function LessonDataForm({ chapters, lesson }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<LessonDataFields>(() => (lesson ? fromLessonData(lesson) : emptyLessonData()));

  const setField = <K extends keyof LessonDataFields>(key: K, value: LessonDataFields[K]) =>
    setFields((prev) => ({ ...prev, [key]: value }));

  const togglePersona = (p: PersonaType) =>
    setField("personas", fields.personas.includes(p) ? fields.personas.filter((x) => x !== p) : [...fields.personas, p]);

  function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const input = toLessonDataInput(fields);

    startTransition(async () => {
      if (lesson) {
        const result = await saveLessonData(lesson.id, input);
        if (!result.ok) return setError(result.error);
        toast.add({ title: "Lesson saved", type: "success" });
        router.refresh();
      } else {
        const result = await createLessonWithStage(input);
        if (!result.ok) return setError(result.error);
        // nowa lekcja jest już w menu (revalidate), przechodzimy do jej edycji
        router.push(`/panel/lesson/${result.id}`);
      }
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <LessonDetailsCard fields={fields} chapters={chapters} onChange={setField} onTogglePersona={togglePersona} />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div>
        <ChunkyButton type="submit" tone="success" size="lg" disabled={pending}>
          {pending ? "Saving…" : lesson ? "Save changes" : "Create lesson"}
        </ChunkyButton>
      </div>
    </form>
  );
}
