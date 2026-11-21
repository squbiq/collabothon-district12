import type { StoryStep as StoryStepData } from "@/types/steps";
import { StepText } from "./step-text";

export function StoryStep({ step }: { step: StoryStepData }) {
  return <StepText>{step.narrative}</StepText>;
}
