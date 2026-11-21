import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "../form-field";
import type { StepFieldsProps } from "./types";

export function ConceptFields({ step, onChange }: StepFieldsProps) {
  return (
    <>
      <FormField label="Explanation" htmlFor={`step-explanation-${step.key}`}>
        <Textarea
          id={`step-explanation-${step.key}`}
          required
          rows={5}
          value={step.explanation}
          onChange={(e) => onChange({ explanation: e.target.value })}
        />
      </FormField>
      <FormField label="Key takeaway" htmlFor={`step-takeaway-${step.key}`}>
        <Input
          id={`step-takeaway-${step.key}`}
          required
          value={step.keyTakeaway}
          onChange={(e) => onChange({ keyTakeaway: e.target.value })}
        />
      </FormField>
    </>
  );
}
