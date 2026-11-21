// Wybiera widok odpowiedni dla typu kroku.
import type { LessonStep } from "@/types/steps";
import { ConceptStep } from "./concept-step";
import { DecisionStep } from "./decision-step";
import { BudgetStep } from "./budget-step";
import { EstimateStep } from "./estimate-step";
import { GrowthStep } from "./growth-step";
import { MatchingStep } from "./matching-step";
import { RiskStep } from "./risk-step";
import { StoryStep } from "./story-step";
import { SummaryStep } from "./summary-step";

type Props = {
  step: LessonStep;
  selectedOptionId: string | null;
  onSelectOption: (id: string) => void;
  /** Krok interaktywny zgłasza, że można przejść dalej. */
  onComplete: () => void;
};

export function StepView({ step, selectedOptionId, onSelectOption, onComplete }: Props) {
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
    case "matching":
      return <MatchingStep key={step.id} step={step} onComplete={onComplete} />;
    case "growth":
      return <GrowthStep key={step.id} step={step} onComplete={onComplete} />;
    case "budget":
      return <BudgetStep key={step.id} step={step} onComplete={onComplete} />;
    case "risk":
      return <RiskStep key={step.id} step={step} onComplete={onComplete} />;
    case "estimate":
      return <EstimateStep key={step.id} step={step} onComplete={onComplete} />;
  }
}
