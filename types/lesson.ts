// types/lesson.ts

import { PersonaType } from "./users";
import { LessonStep } from "./steps";

// statusy lekcji
export type LessonStatus = "locked" | "active" | "completed";

// Sama struktura opisu lekcji
export interface Lesson {
  id: string;
  order: number;
  chapterTitle: string;
  title: string;
  description: string; // było: Description
  estimatedMinutes: number;
  unlockAssetId?: string | null;
  targetPersonas: PersonaType[];
  steps: LessonStep[];
}

export type TopicRoadmapItem = Omit<Lesson, "steps"> & {
  status: LessonStatus;
  stepsCount: number;
};

export interface CompleteLesson {
  topicId: string;
  earnedCurrency: number;
  newWalletBalance: number;
  unlockedAssetId?: string | null;
  alreadyCompleted: boolean;
}