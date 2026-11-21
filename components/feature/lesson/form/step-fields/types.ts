import type { StepDraft } from "../step-draft";

// Wspólne propsy pól zależnych od typu kroku.
export type StepFieldsProps = {
  step: StepDraft;
  onChange: (patch: Partial<StepDraft>) => void;
};
