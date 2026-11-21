import { Plus } from "lucide-react";
import { ChunkyButton } from "@/components/shared/chunky-button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "../form-field";
import { emptyOption, type OptionDraft } from "../step-draft";
import type { StepFieldsProps } from "./types";

export function DecisionFields({ step, onChange }: StepFieldsProps) {
  const updateOption = (key: number, patch: Partial<OptionDraft>) =>
    onChange({ options: step.options.map((o) => (o.key === key ? { ...o, ...patch } : o)) });

  return (
    <>
      <FormField label="Scenario" htmlFor={`step-scenario-${step.key}`}>
        <Textarea
          id={`step-scenario-${step.key}`}
          required
          rows={4}
          value={step.scenario}
          onChange={(e) => onChange({ scenario: e.target.value })}
        />
      </FormField>

      <div className="flex flex-col gap-3">
        <Label className="font-semibold">Options (at least 2)</Label>

        {step.options.map((option, i) => {
          const optimalId = `optimal-${option.key}`;
          return (
            <div key={option.key} className="flex flex-col gap-3 rounded-lg border bg-muted/40 p-4">
              <FormField label={`Option ${i + 1}`} htmlFor={`option-label-${option.key}`}>
                <Input
                  id={`option-label-${option.key}`}
                  value={option.label}
                  onChange={(e) => updateOption(option.key, { label: e.target.value })}
                />
              </FormField>

              <FormField label="Feedback after choosing" htmlFor={`option-feedback-${option.key}`}>
                <Textarea
                  id={`option-feedback-${option.key}`}
                  rows={2}
                  value={option.feedback}
                  onChange={(e) => updateOption(option.key, { feedback: e.target.value })}
                />
              </FormField>

              <div className="flex items-center justify-between gap-3">
                <Label htmlFor={optimalId} className="flex cursor-pointer items-center gap-2 font-medium">
                  <Checkbox
                    id={optimalId}
                    checked={option.isOptimal}
                    onCheckedChange={(checked) => updateOption(option.key, { isOptimal: checked === true })}
                  />
                  Best option
                </Label>

                <ChunkyButton tone="outline-primary" size="sm"
                  type="button"
                  disabled={step.options.length <= 2}
                  onClick={() => onChange({ options: step.options.filter((o) => o.key !== option.key) })}
                >
                  Remove option
                </ChunkyButton>
              </div>
            </div>
          );
        })}

        <ChunkyButton tone="outline-primary" size="sm" className="self-start"
          type="button"
          onClick={() => onChange({ options: [...step.options, emptyOption()] })}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add option
        </ChunkyButton>
      </div>
    </>
  );
}
