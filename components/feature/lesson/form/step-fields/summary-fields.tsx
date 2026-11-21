import { Plus, X } from "lucide-react";
import { ChunkyButton } from "@/components/shared/chunky-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "../form-field";
import type { StepFieldsProps } from "./types";

export function SummaryFields({ step, onChange }: StepFieldsProps) {
  const setTakeaway = (i: number, value: string) =>
    onChange({ takeaways: step.takeaways.map((t, j) => (j === i ? value : t)) });

  return (
    <>
      <FormField label="Summary" htmlFor={`step-summary-${step.key}`}>
        <Textarea
          id={`step-summary-${step.key}`}
          required
          rows={4}
          value={step.summary}
          onChange={(e) => onChange({ summary: e.target.value })}
        />
      </FormField>

      <div className="flex flex-col gap-2">
        <Label className="font-semibold">Key takeaways</Label>
        {step.takeaways.map((t, i) => (
          <div key={i} className="flex gap-2">
            <Input value={t} onChange={(e) => setTakeaway(i, e.target.value)} aria-label={`Takeaway ${i + 1}`} />
            <ChunkyButton tone="outline-primary" size="sm" className="aspect-square px-0"
              type="button"
              disabled={step.takeaways.length <= 1}
              onClick={() => onChange({ takeaways: step.takeaways.filter((_, j) => j !== i) })}
              aria-label={`Remove takeaway ${i + 1}`}
            >
              <X className="h-4 w-4" />
            </ChunkyButton>
          </div>
        ))}
        <ChunkyButton tone="outline-primary" size="sm" className="self-start"
          type="button"
          onClick={() => onChange({ takeaways: [...step.takeaways, ""] })}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add takeaway
        </ChunkyButton>
      </div>
    </>
  );
}
