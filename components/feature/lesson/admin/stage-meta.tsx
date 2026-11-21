// Ikonki i opisy typów etapów (stage'y) używane w menu i w dialogu dodawania.
import { ArrowLeftRight, BookOpen, Calculator, GitBranch, Lightbulb, ListChecks, PieChart, Scale, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";
import type { StepType } from "@/components/feature/lesson/form/step-draft";

export const STAGE_ICONS: Record<StepType, ReactNode> = {
  story: <BookOpen className="size-4" />,
  concept: <Lightbulb className="size-4" />,
  decision: <GitBranch className="size-4" />,
  summary: <ListChecks className="size-4" />,
  matching: <ArrowLeftRight className="size-4" />,
  growth: <TrendingUp className="size-4" />,
  budget: <PieChart className="size-4" />,
  risk: <Scale className="size-4" />,
  estimate: <Calculator className="size-4" />,
};

export const STAGE_DESCRIPTIONS: Record<StepType, string> = {
  story: "A short real-life example that introduces the topic.",
  concept: "An explanation of the concept with one key takeaway.",
  decision: "A scenario with options, each with its own feedback.",
  summary: "A wrap-up of the lesson with key takeaways.",
  matching: "Match each definition with the correct term.",
  growth: "Sliders and a live chart: reach a savings goal under constraints.",
  budget: "Split a monthly budget with linked sliders and a stress bar.",
  risk: "Pick asset classes so the needle lands in the green zone.",
  estimate: "Guess a number by eye, then see the real math.",
};