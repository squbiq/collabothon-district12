// lib/lesson/default-stage.ts
//
// Domyślna treść nowego stage'a. Jest poprawna dla walidacji i odtwarzacza,
// więc świeżo utworzona lekcja od razu się wyświetla – admin tylko podmienia tekst.
import type { StepInput } from "@/types/lesson-input";
import { DEFAULT_CONFIGS } from "./interactive-config";

export function defaultStage(type: StepInput["type"]): StepInput {
  switch (type) {
    case "story":
      return { type, title: "New story", narrative: "Write a short real-life story here." };
    case "concept":
      return {
        type,
        title: "New concept",
        explanation: "Explain the concept here.",
        keyTakeaway: "Write the key takeaway here.",
      };
    case "decision":
      return {
        type,
        title: "New decision",
        scenario: "Describe the situation here.",
        options: [
          { label: "Best option", isOptimal: true, feedback: "Explain why this is the best choice." },
          { label: "Other option", isOptimal: false, feedback: "Explain the consequences of this choice." },
        ],
      };
    case "summary":
      return {
        type,
        title: "Summary",
        summary: "Summarize what the learner has seen.",
        keyTakeaways: ["Key takeaway"],
      };
    case "matching":
      return {
        type,
        title: "Match the terms",
        pairs: [
          {
            term: "Inflation",
            definition: "A general rise in prices that reduces what your money can buy.",
          },
          {
            term: "Diversification",
            definition: "Spreading your money across different investments to reduce risk.",
          },
        ],
      };
    case "growth":
      return { type, title: "Growth sliders", config: { ...DEFAULT_CONFIGS.growth } };
    case "budget":
      return { type, title: "Budget split", config: { ...DEFAULT_CONFIGS.budget } };
    case "risk":
      return { type, title: "Risk and return", config: { ...DEFAULT_CONFIGS.risk } };
    case "estimate":
      return { type, title: "Estimate it", config: { ...DEFAULT_CONFIGS.estimate } };
  }
}
