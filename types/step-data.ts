// types/step-data.ts
//
// Zawartość kolumny `LessonStep.data` (Json) dla każdego typu kroku.
// Tabela ma tylko wspólne kolumny (id, lessonId, order, type, title) – wszystko, co zależy
// od typu, leży w `data`. Kształt jest egzekwowany przez parseStep (lib/lesson/step-parser.ts).
import type { BudgetConfig, EstimateConfig, GrowthConfig, RiskConfig } from "./interactive";

/** story: krótka historia z życia. */
export interface StoryData {
  narrative: string;
}

/** concept: wyjaśnienie + jedna kluczowa myśl. */
export interface ConceptData {
  explanation: string;
  keyTakeaway: string;
}

/** Opcja kroku decision. `id` jest unikalne w obrębie kroku, kolejność = kolejność w tablicy. */
export interface DecisionOptionData {
  id: string;
  label: string;
  isOptimal: boolean;
  feedback: string;
}

/** decision: scenariusz i min. 2 opcje (co najmniej jedna optymalna). */
export interface DecisionData {
  scenario: string;
  options: DecisionOptionData[];
}

/** summary: podsumowanie i lista kluczowych wniosków. */
export interface SummaryData {
  summary: string;
  keyTakeaways: string[];
}

/** matching: 2–6 par (unikalne definicje i terminy). */
export interface MatchingData {
  pairs: { term: string; definition: string }[];
}

/** Typ kroku -> kształt jego `data`. growth/budget/risk/estimate trzymają w `data` całą konfigurację. */
export interface StepDataMap {
  story: StoryData;
  concept: ConceptData;
  decision: DecisionData;
  summary: SummaryData;
  matching: MatchingData;
  growth: GrowthConfig;
  budget: BudgetConfig;
  risk: RiskConfig;
  estimate: EstimateConfig;
}

export type StepKind = keyof StepDataMap;
export type StepData<T extends StepKind = StepKind> = StepDataMap[T];
