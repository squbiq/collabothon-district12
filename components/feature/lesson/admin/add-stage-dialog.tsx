// Dialog wyboru typu nowego etapu (stage'a) dla lekcji.
"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createStage } from "@/lib/lesson/admin-actions";
import { ChunkyButton } from "@/components/shared/chunky-button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { STEP_LABELS, STEP_TYPES, type StepType } from "@/components/feature/lesson/form/step-draft";
import { STAGE_DESCRIPTIONS, STAGE_ICONS } from "./stage-meta";

type Props = {
  /** Lekcja, do której dodajemy etap; null = dialog zamknięty. */
  lesson: { id: string; title: string } | null;
  onClose: () => void;
};

export function AddStageDialog({ lesson, onClose }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function add(type: StepType) {
    if (!lesson) return;
    setError(null);
    startTransition(async () => {
      const result = await createStage(lesson.id, type);
      if (result.ok) {
        onClose();
        router.push(`/panel/lesson/${lesson.id}/${result.id}`);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <Dialog open={lesson !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Add stage</DialogTitle>
          <DialogDescription>Choose the type of the new stage in “{lesson?.title}”.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          {STEP_TYPES.map((type) => (
            <ChunkyButton
              key={type}
              type="button"
              tone="outline-primary"
              disabled={pending}
              onClick={() => add(type)}
              className="h-auto min-w-56 flex-1 basis-56 justify-start gap-3 py-3 text-left whitespace-normal normal-case"
            >
              {STAGE_ICONS[type]}
              <span className="flex flex-col">
                <span className="font-extrabold uppercase">{STEP_LABELS[type]}</span>
                <span className="text-xs font-medium text-muted-foreground">{STAGE_DESCRIPTIONS[type]}</span>
              </span>
            </ChunkyButton>
          ))}
        </div>

        {error && <p className="text-sm font-medium text-destructive">{error}</p>}
      </DialogContent>
    </Dialog>
  );
}
