import type { ConceptStep as ConceptStepData } from "@/types/steps";
import { StepText } from "./step-text";

export function ConceptStep({ step }: { step: ConceptStepData }) {
  return (
    <>
      <StepText>{step.explanation}</StepText>
      <div className="rounded-2xl border-2 border-sky-300 bg-sky-100 p-5 dark:border-sky-700 dark:bg-sky-950">
        <p className="font-extrabold text-sky-700 dark:text-sky-300">Key takeaway</p>
        <p className="mt-1 font-medium text-sky-800 dark:text-sky-200">{step.keyTakeaway}</p>
      </div>
    </>
  );
}
