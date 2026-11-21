import { Textarea } from "@/components/ui/textarea";
import { FormField } from "../form-field";
import type { StepFieldsProps } from "./types";

export function StoryFields({ step, onChange }: StepFieldsProps) {
  return (
    <FormField label="Story" hint="A short real-life example" htmlFor={`step-narrative-${step.key}`}>
      <Textarea
        id={`step-narrative-${step.key}`}
        required
        rows={5}
        value={step.narrative}
        onChange={(e) => onChange({ narrative: e.target.value })}
      />
    </FormField>
  );
}
