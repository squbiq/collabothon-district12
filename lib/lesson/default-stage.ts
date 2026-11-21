// lib/lesson/default-stage.ts
//
// Domyślna treść nowego stage'a. Jest poprawna dla walidacji i odtwarzacza,
// więc świeżo utworzona lekcja od razu się wyświetla – admin tylko podmienia tekst.
import type { StepInput } from "@/types/lesson-input";

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
  }
}
