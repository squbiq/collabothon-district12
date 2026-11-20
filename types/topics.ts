import { PersonaType } from "./users";
import { LessonStep } from "./steps";

// statusy lekcji
export type TopicStatus = 'locked' | 'active' | 'completed';

// Sama struktura opisu lekcji
export interface Topic {
    id: string;
    order: number;
    chapterTitle: string;
    title: string;
    Description: string;
    estimatedMinutes: number;
    unlockAssetId?: string | null;
    targetPersonas: PersonaType[];
    steps: LessonStep[];
}

export type TopicRoadmapItem = Omit<Topic, 'steps'> & {
    status: TopicStatus;
    stepsCount: number;
};

export interface CompleteTopic {
    topicId: string;
    earnedCurrency: number;
    newWalletBalance: number;
    unlockedAssetId?: string | null;
    alreadyCompleted: boolean;
}

