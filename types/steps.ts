export interface BaseStep {
    id: string;
    title: string;
}

// Ten Krok ma zaprezentowac jakis fajny krotki przyklad z życia

export interface StoryStep extends BaseStep {
    type: 'story';
    narrative: string;
}

// Krok 2: Wyjasnienie konceptu
export interface ConceptStep extends BaseStep {
    type: 'concept';
    explanation: string;
    keyTakeaway: string;
}

// Krok 3: Scenariusz decyzyjny (Case Study bez kar)
export interface DecisionOption {
    id: string;
    label: string;
    isOptimal: boolean;
    feedback: string;
} 

export interface DecisionStep extends BaseStep {
    type: 'decision';
    scenario: string;
    options: DecisionOption[];
}

//Krok 4: Podsumowanie lekcji?
export interface SummaryStep extends BaseStep {
    type: 'summary';
    summary: string;
    keyTakeaways: string[];
}

export type LessonStep = StoryStep 
| ConceptStep 
| DecisionStep 
| SummaryStep;