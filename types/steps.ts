export interface BaseStep {
  id: string;
  title: string;
}

/** Krok 1: krótki przykład z życia, wprowadzenie do tematu. */
export interface StoryStep extends BaseStep {
  type: "story";
  narrative: string;
}

/** Krok 2: wyjaśnienie konceptu + jedna kluczowa myśl. */
export interface ConceptStep extends BaseStep {
  type: "concept";
  explanation: string;
  keyTakeaway: string;
}

export interface DecisionOption {
  id: string;
  label: string;
  isOptimal: boolean;
  feedback: string;
}

/** Krok 3: scenariusz decyzyjny (case study bez kar, każda opcja ma feedback). */
export interface DecisionStep extends BaseStep {
  type: "decision";
  scenario: string;
  options: DecisionOption[];
}

/** Krok 4: podsumowanie lekcji. */
export interface SummaryStep extends BaseStep {
  type: "summary";
  summary: string;
  keyTakeaways: string[];
}

export type LessonStep = StoryStep | ConceptStep | DecisionStep | SummaryStep;
