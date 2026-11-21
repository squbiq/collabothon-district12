import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "../form-field";
import { emptyPair, type PairDraft } from "../step-draft";
import type { StepFieldsProps } from "./types";

const MIN_PAIRS = 2;
const MAX_PAIRS = 6;

export function MatchingFields({ step, onChange }: StepFieldsProps) {
  const updatePair = (key: number, patch: Partial<PairDraft>) =>
    onChange({ pairs: step.pairs.map((p) => (p.key === key ? { ...p, ...patch } : p)) });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <Label className="font-semibold">Pairs (at least {MIN_PAIRS})</Label>
        <p className="text-sm text-muted-foreground">
          Learners see definitions on the left and terms on the right, both in random order.
        </p>
      </div>

      {step.pairs.map((pair, i) => (
        <div key={pair.key} className="flex flex-col gap-3 rounded-lg border bg-muted/40 p-4">
          <FormField label={`Definition ${i + 1}`} htmlFor={`pair-definition-${pair.key}`}>
            <Textarea
              id={`pair-definition-${pair.key}`}
              required
              rows={2}
              value={pair.definition}
              onChange={(e) => updatePair(pair.key, { definition: e.target.value })}
            />
          </FormField>

          <FormField label={`Matching term ${i + 1}`} htmlFor={`pair-term-${pair.key}`}>
            <Input
              id={`pair-term-${pair.key}`}
              required
              value={pair.term}
              onChange={(e) => updatePair(pair.key, { term: e.target.value })}
            />
          </FormField>

          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={step.pairs.length <= MIN_PAIRS}
              onClick={() => onChange({ pairs: step.pairs.filter((p) => p.key !== pair.key) })}
            >
              Remove pair
            </Button>
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={step.pairs.length >= MAX_PAIRS}
        onClick={() => onChange({ pairs: [...step.pairs, emptyPair()] })}
        className="self-start"
      >
        <Plus className="mr-1.5 h-4 w-4" />
        Add pair
      </Button>
    </div>
  );
}