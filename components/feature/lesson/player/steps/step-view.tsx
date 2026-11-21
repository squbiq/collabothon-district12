// Wybiera widok odpowiedni dla typu kroku.
import type { LessonStep } from "@/types/steps";
import { ConceptStep } from "./concept-step";
import { DecisionStep } from "./decision-step";
import { StoryStep } from "./story-step";
import { SummaryStep } from "./summary-step";

type Props = {
  step: LessonStep;
  selectedOptionId: string | null;
  onSelectOption: (id: string) => void;
};

export function StepView({ step, selectedOptionId, onSelectOption }: Props) {
  switch (step.type) {
    case "story":
      return <StoryStep step={step} />;
    case "concept":
      return <ConceptStep step={step} />;
    case "decision":
      // key resetuje stan widoku przy zmianie kroku
      return <DecisionStep key={step.id} step={step} selectedId={selectedOptionId} onSelect={onSelectOption} />;
    case "summary":
      return <SummaryStep step={step} />;
  }
}
