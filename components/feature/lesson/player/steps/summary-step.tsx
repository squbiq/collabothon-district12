import type { SummaryStep as SummaryStepData } from "@/types/steps";
import { StepText } from "./step-text";

export function SummaryStep({ step }: { step: SummaryStepData }) {
  return (
    <>
      <StepText>{step.summary}</StepText>
      {step.keyTakeaways.length > 0 && (
        <ul className="flex flex-col gap-3">
          {step.keyTakeaways.map((item) => (
            <li
              key={item}
              className="flex gap-3 rounded-2xl border-2 border-green-300 bg-green-100 p-4 font-bold text-green-800 dark:border-green-700 dark:bg-green-950 dark:text-green-200"
            >
              <span aria-hidden="true">✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
