// types/daily-transfer.ts
//
// Format pliku JSON do eksportu/importu zadań dziennych (panel admina).

export const DAILY_EXPORT_FORMAT = "daily-lesson-export";
export const DAILY_EXPORT_VERSION = 1;

export type DailyExportTask = {
  /** Pomijane w eksporcie „bez ID". */
  id?: string;
  category: string;
  title: string;
  scenario: string;
  rewardExp: number;
  options: { label: string; isOptimal: boolean; feedback: string }[];
};

export type DailyExportFile = {
  format: typeof DAILY_EXPORT_FORMAT;
  version: typeof DAILY_EXPORT_VERSION;
  tasks: DailyExportTask[];
};