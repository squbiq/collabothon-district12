// Ikonki i opisy typów etapów (stage'y) używane w menu i w dialogu dodawania.
import { ArrowLeftRight, BookOpen, GitBranch, Lightbulb, ListChecks } from "lucide-react";
import type { ReactNode } from "react";
import type { StepType } from "@/components/feature/lesson/form/step-draft";

export const STAGE_ICONS: Record<StepType, ReactNode> = {
  story: <BookOpen className="size-4" />,
  concept: <Lightbulb className="size-4" />,
  decision: <GitBranch className="size-4" />,
  summary: <ListChecks className="size-4" />,
  matching: <ArrowLeftRight className="size-4" />,
};

export const STAGE_DESCRIPTIONS: Record<StepType, string> = {
  story: "A short real-life example that introduces the topic.",
  concept: "An explanation of the concept with one key takeaway.",
  decision: "A scenario with options, each with its own feedback.",
  summary: "A wrap-up of the lesson with key takeaways.",
  matching: "Match each definition with the correct term.",
};