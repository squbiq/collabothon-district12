// Szkice kroków edytowane w formularzu + konwersje do/z formatu API.
import { DEFAULT_CONFIGS } from "@/lib/lesson/interactive-config";
import type { StepInput } from "@/types/lesson-input";
import type { BudgetConfig, EstimateConfig, GrowthConfig, RiskConfig } from "@/types/interactive";

export type StepType = StepInput["type"];

export type OptionDraft = {
  key: number;
  label: string;
  isOptimal: boolean;
  feedback: string;
};

export type PairDraft = {
  key: number;
  term: string;
  definition: string;
};

export type StepDraft = {
  key: number;
  type: StepType;
  title: string;
  narrative: string;
  explanation: string;
  keyTakeaway: string;
  scenario: string;
  summary: string;
  takeaways: string[];
  options: OptionDraft[];
  pairs: PairDraft[];
  // ustawienia kroków interaktywnych (każdy typ ma własne, edytowane osobno)
  growth: GrowthConfig;
  budget: BudgetConfig;
  risk: RiskConfig;
  estimate: EstimateConfig;
};

export const STEP_LABELS: Record<StepType, string> = {
  story: "Story",
  concept: "Concept",
  decision: "Decision",
  summary: "Summary",
  matching: "Matching",
  growth: "Growth sliders",
  budget: "Budget split",
  risk: "Risk & return",
  estimate: "Estimate",
};
export const STEP_TYPES = Object.keys(STEP_LABELS) as StepType[];

// Klucze Reacta dla list edytowalnych w formularzu.
let uid = 0;
export const nextKey = () => ++uid;

export const emptyOption = (): OptionDraft => ({
  key: nextKey(),
  label: "",
  isOptimal: false,
  feedback: "",
});

export const emptyPair = (): PairDraft => ({
  key: nextKey(),
  term: "",
  definition: "",
});

export const emptyStep = (type: StepType): StepDraft => ({
  key: nextKey(),
  type,
  title: "",
  narrative: "",
  explanation: "",
  keyTakeaway: "",
  scenario: "",
  summary: "",
  takeaways: [""],
  options: [emptyOption(), emptyOption()],
  pairs: [emptyPair(), emptyPair()],
  growth: { ...DEFAULT_CONFIGS.growth },
  budget: { ...DEFAULT_CONFIGS.budget },
  risk: { ...DEFAULT_CONFIGS.risk },
  estimate: { ...DEFAULT_CONFIGS.estimate },
});

// Szkic formularza -> format wysyłany do API
export function toStepInput(s: StepDraft): StepInput {
  switch (s.type) {
    case "story":
      return { type: "story", title: s.title, narrative: s.narrative };
    case "concept":
      return {
        type: "concept",
        title: s.title,
        explanation: s.explanation,
        keyTakeaway: s.keyTakeaway,
      };
    case "decision":
      return {
        type: "decision",
        title: s.title,
        scenario: s.scenario,
        options: s.options
          .filter((o) => o.label.trim() || o.feedback.trim())
          .map(({ label, isOptimal, feedback }) => ({ label, isOptimal, feedback })),
      };
    case "summary":
      return {
        type: "summary",
        title: s.title,
        summary: s.summary,
        keyTakeaways: s.takeaways.filter((t) => t.trim()),
      };
    case "matching":
      return {
        type: "matching",
        title: s.title,
        pairs: s.pairs
          .filter((p) => p.term.trim() || p.definition.trim())
          .map(({ term, definition }) => ({ term, definition })),
      };
    case "growth":
      return { type: "growth", title: s.title, config: s.growth };
    case "budget":
      return { type: "budget", title: s.title, config: s.budget };
    case "risk":
      return { type: "risk", title: s.title, config: s.risk };
    case "estimate":
      return { type: "estimate", title: s.title, config: s.estimate };
  }
}

// Dane z API -> szkic formularza (potrzebne przy edycji)
export function fromStepInput(step: StepInput): StepDraft {
  const base = emptyStep(step.type);
  base.title = step.title;

  switch (step.type) {
    case "story":
      base.narrative = step.narrative;
      break;
    case "concept":
      base.explanation = step.explanation;
      base.keyTakeaway = step.keyTakeaway;
      break;
    case "decision":
      base.scenario = step.scenario;
      base.options =
        step.options.length > 0
          ? step.options.map((o) => ({ key: nextKey(), ...o }))
          : [emptyOption(), emptyOption()];
      break;
    case "summary":
      base.summary = step.summary;
      base.takeaways = step.keyTakeaways.length > 0 ? [...step.keyTakeaways] : [""];
      break;
    case "matching":
      base.pairs =
        step.pairs.length > 0
          ? step.pairs.map((p) => ({ key: nextKey(), term: p.term, definition: p.definition }))
          : [emptyPair(), emptyPair()];
      break;
    case "growth":
      base.growth = step.config;
      break;
    case "budget":
      base.budget = step.config;
      break;
    case "risk":
      base.risk = step.config;
      break;
    case "estimate":
      base.estimate = step.config;
      break;
  }

  return base;
}