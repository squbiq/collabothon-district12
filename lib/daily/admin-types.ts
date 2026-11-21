// Typy wspólne dla panelu admina (zadania dzienne).
export type DailyOptionInput = {
  /** Obecne tylko przy istniejących opcjach – pozwala zachować odpowiedzi użytkowników. */
  id?: string;
  label: string;
  isOptimal: boolean;
  feedback: string;
};

export type DailyTaskInput = {
  category: string;
  title: string;
  scenario: string;
  rewardExp: number;
  /** Czy zadanie może pojawiać się też w arenie. */
  options: DailyOptionInput[];
};

export type DailyTaskListItem = {
  id: string;
  title: string;
  category: string;
  rewardExp: number;
  optionCount: number;
  /** Data, na którą zadanie zostało przypisane; null = czeka w puli. */
  dateKey: string | null;
  answers: number;
};

export type DailyTaskForEdit = DailyTaskInput & { id: string; dateKey: string | null; answers: number };
