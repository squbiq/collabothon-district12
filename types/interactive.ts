// Ustawienia kroków interaktywnych. Treść jest stała (bez zmiennych losowych) – edytuje ją admin.

/** Suwaki przyczynowo-skutkowe: wykres wzrostu kapitału. */
export interface GrowthConfig {
  prompt: string;
  /** Cel w EUR (waluta bazowa). */
  goalAmount: number;
  /** Wiek, w którym cel ma być osiągnięty. */
  targetAge: number;
  /** Górny limit miesięcznej wpłaty w EUR (ograniczenie zadania). */
  maxMonthly: number;
  startAgeMin: number;
  startAgeMax: number;
  /** Zakres rocznej stopy zwrotu w %. */
  rateMin: number;
  rateMax: number;
  insight: string;
}

/** Alokacja budżetu: 5 suwaków sumujących się do 100% przychodu. */
export interface BudgetConfig {
  prompt: string;
  income: number;
  /** Minimum na stałe opłaty (EUR); poniżej rośnie stres finansowy. */
  fixedMin: number;
  /** Minimum na bieżące wydatki (EUR); poniżej rośnie stres finansowy. */
  livingMin: number;
  /** Ile łącznie ma trafić do oszczędności i inwestycji (EUR). */
  savingsGoal: number;
  insight: string;
}

/** Waga ryzyka i zysku: dobór klas aktywów do profilu osoby. */
export interface RiskConfig {
  prompt: string;
  profileName: string;
  profileSummary: string;
  horizonYears: number;
  /** Zielona strefa na skali ryzyka (0–100). */
  zoneMin: number;
  zoneMax: number;
  insight: string;
}

/** Szacowanie na oko: odpowiedź liczbowa kontra twarda matematyka. */
export interface EstimateConfig {
  prompt: string;
  unit: string;
  min: number;
  max: number;
  /** Prawidłowa wartość. */
  answer: number;
  insight: string;
}
