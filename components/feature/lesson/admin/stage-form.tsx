// Edycja pojedynczego etapu (stage'a) lekcji + usuwanie.
"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AlertCircle } from "lucide-react";
import { ChunkyButton } from "@/components/shared/chunky-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { deleteStage, updateStage } from "@/lib/lesson/admin-actions";
import type { StageDetails } from "@/types/lesson-input";
import { FormField } from "@/components/feature/lesson/form/form-field";
import {
  STEP_LABELS,
  STEP_TYPES,
  fromStepInput,
  toStepInput,
  type StepDraft,
  type StepType,
} from "@/components/feature/lesson/form/step-draft";
import { ConceptFields } from "@/components/feature/lesson/form/step-fields/concept-fields";
import { DecisionFields } from "@/components/feature/lesson/form/step-fields/decision-fields";
import { MatchingFields } from "@/components/feature/lesson/form/step-fields/matching-fields";
import { StoryFields } from "@/components/feature/lesson/form/step-fields/story-fields";
import { SummaryFields } from "@/components/feature/lesson/form/step-fields/summary-fields";
import { ConfirmDeleteDialog } from "./confirm-dialog";

type Props = { lessonId: string; stage: StageDetails };

export function StageForm({ lessonId, stage }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [draft, setDraft] = useState<StepDraft>(() => fromStepInput(stage));

  const patch = (p: Partial<StepDraft>) => setDraft((prev) => ({ ...prev, ...p }));

  function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateStage(lessonId, stage.id, toStepInput(draft));
      if (!result.ok) return setError(result.error);
      toast.add({ title: "Stage saved", type: "success" });
      router.refresh();
    });
  }

  function remove() {
    setError(null);
    startTransition(async () => {
      const result = await deleteStage(lessonId, stage.id);
      if (!result.ok) return setError(result.error);
      router.push(`/panel/lesson/${lessonId}`);
    });
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
        <FormField label="Stage title" htmlFor="stage-title">
          <Input id="stage-title" required value={draft.title} onChange={(e) => patch({ title: e.target.value })} />
        </FormField>

        <FormField label="Type" htmlFor="stage-type">
          <Select
            items={STEP_TYPES.map((t) => ({ value: t, label: STEP_LABELS[t] }))}
            value={draft.type}
            onValueChange={(value) => value && patch({ type: value as StepType })}
          >
            <SelectTrigger id="stage-type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STEP_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {STEP_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </div>

      {draft.type === "story" && <StoryFields step={draft} onChange={patch} />}
      {draft.type === "concept" && <ConceptFields step={draft} onChange={patch} />}
      {draft.type === "decision" && <DecisionFields step={draft} onChange={patch} />}
      {draft.type === "summary" && <SummaryFields step={draft} onChange={patch} />}
      {draft.type === "matching" && <MatchingFields step={draft} onChange={patch} />}

      {error && !confirmOpen && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <ChunkyButton type="submit" tone="success" size="lg" disabled={pending}>
          {pending ? "Saving…" : "Save stage"}
        </ChunkyButton>
        <ChunkyButton type="button" tone="outline-danger" size="lg" disabled={pending} onClick={() => setConfirmOpen(true)}>
          Delete stage
        </ChunkyButton>
      </div>

      <ConfirmDeleteDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete stage?"
        description="This stage will be permanently deleted."
        pending={pending}
        error={error}
        onConfirm={remove}
      />
    </form>
  );
}