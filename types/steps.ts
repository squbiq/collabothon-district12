import type { BudgetConfig, EstimateConfig, GrowthConfig, RiskConfig } from "./interactive";

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

export interface MatchingPair {
  id: string;
  term: string;
  definition: string;
}

/** Krok 5: łączenie definicji (lewa kolumna) z nazwami (prawa kolumna). */
export interface MatchingStep extends BaseStep {
  type: "matching";
  pairs: MatchingPair[];
}

/** Krok 6: suwaki przyczynowo-skutkowe z wykresem wzrostu kapitału. */
export interface GrowthStep extends BaseStep {
  type: "growth";
  config: GrowthConfig;
}

/** Krok 7: alokacja budżetu z paskiem stresu finansowego. */
export interface BudgetStep extends BaseStep {
  type: "budget";
  config: BudgetConfig;
}

/** Krok 8: waga ryzyka i zysku. */
export interface RiskStep extends BaseStep {
  type: "risk";
  config: RiskConfig;
}

/** Krok 9: szacowanie na oko. */
export interface EstimateStep extends BaseStep {
  type: "estimate";
  config: EstimateConfig;
}

export type LessonStep =
  | StoryStep
  | ConceptStep
  | DecisionStep
  | SummaryStep
  | MatchingStep
  | GrowthStep
  | BudgetStep
  | RiskStep
  | EstimateStep;