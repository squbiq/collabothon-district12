// lib/lesson/interactive-config.ts
//
// Walidacja (dane z formularza i z importu są niezaufane) i domyślna treść kroków interaktywnych.
import { z } from "zod";
import type { BudgetConfig, EstimateConfig, GrowthConfig, RiskConfig } from "@/types/interactive";
import { growthReachable, riskZoneReachable } from "./interactive-math";

export const INTERACTIVE_TYPES = ["growth", "budget", "risk", "estimate"] as const;
export type InteractiveType = (typeof INTERACTIVE_TYPES)[number];
export const isInteractiveType = (t: string): t is InteractiveType =>
  (INTERACTIVE_TYPES as readonly string[]).includes(t);

const text = z.string().trim().min(1);
const num = z.number().finite();
const int = z.number().int();
const MAX_MONEY = 1_000_000_000;

const growthSchema = z
  .object({
    prompt: text,
    goalAmount: num.positive().max(MAX_MONEY),
    targetAge: int.min(1).max(120),
    maxMonthly: num.positive().max(MAX_MONEY),
    startAgeMin: int.min(0).max(120),
    startAgeMax: int.min(0).max(120),
    rateMin: num.min(0).max(50),
    rateMax: num.min(0).max(50),
    insight: text,
  })
  .refine((c) => c.startAgeMin < c.startAgeMax, { message: "The latest start age must be higher than the earliest.", path: ["startAgeMax"] })
  .refine((c) => c.startAgeMax < c.targetAge, { message: "The target age must be higher than the latest start age.", path: ["targetAge"] })
  .refine((c) => c.rateMin < c.rateMax, { message: "The highest return must be higher than the lowest.", path: ["rateMax"] })
  .refine((c) => growthReachable(c), { message: "The goal can't be reached even with the best slider settings.", path: ["goalAmount"] });

const budgetSchema = z
  .object({
    prompt: text,
    income: num.positive().max(MAX_MONEY),
    fixedMin: num.min(0).max(MAX_MONEY),
    livingMin: num.min(0).max(MAX_MONEY),
    savingsGoal: num.positive().max(MAX_MONEY),
    insight: text,
  })
  .refine((c) => c.fixedMin + c.livingMin > 0, { message: "Set a minimum for fixed bills or living costs.", path: ["fixedMin"] })
  // zostawiamy co najmniej 5% na przyjemności, żeby zadanie dało się rozwiązać bez stresu
  .refine((c) => c.fixedMin + c.livingMin + c.savingsGoal <= c.income * 0.95, {
    message: "Fixed + living minimums and the savings goal must fit in 95% of the income.",
    path: ["savingsGoal"],
  });

const riskSchema = z
  .object({
    prompt: text,
    profileName: text.max(100),
    profileSummary: text,
    horizonYears: int.min(0).max(80),
    zoneMin: int.min(0).max(100),
    zoneMax: int.min(0).max(100),
    insight: text,
  })
  .refine((c) => c.zoneMin < c.zoneMax, { message: "The green zone must have a start below its end.", path: ["zoneMax"] })
  .refine((c) => riskZoneReachable(c), { message: "No portfolio of these assets can land in this zone.", path: ["zoneMin"] });

const estimateSchema = z
  .object({
    prompt: text,
    unit: z.string().trim().max(20),
    min: num,
    max: num,
    answer: num,
    insight: text,
  })
  .refine((c) => c.min < c.max, { message: "The maximum must be higher than the minimum.", path: ["max"] })
  .refine((c) => c.answer > c.min && c.answer < c.max, { message: "The correct answer must lie inside the slider range.", path: ["answer"] });

const SCHEMAS = { growth: growthSchema, budget: budgetSchema, risk: riskSchema, estimate: estimateSchema } as const;

type ConfigOf = { growth: GrowthConfig; budget: BudgetConfig; risk: RiskConfig; estimate: EstimateConfig };

export type ConfigResult<T extends InteractiveType> = { ok: true; config: ConfigOf[T] } | { ok: false; error: string };

export function parseConfig<T extends InteractiveType>(type: T, raw: unknown): ConfigResult<T> {
  const result = SCHEMAS[type].safeParse(raw);
  if (result.success) return { ok: true, config: result.data as ConfigOf[T] };
  const issue = result.error.issues[0];
  const field = issue.path.length ? `${issue.path.join(".")}: ` : "";
  return { ok: false, error: `${field}${issue.message}` };
}

export const DEFAULT_CONFIGS: ConfigOf = {
  growth: {
    prompt: "Build 1,000,000 zł by age 60 while putting aside at most 500 zł a month. Which settings make it work?",
    goalAmount: 1_000_000,
    targetAge: 60,
    maxMonthly: 500,
    startAgeMin: 20,
    startAgeMax: 45,
    rateMin: 0,
    rateMax: 10,
    insight: "Time does most of the work: starting earlier beats paying in more, because compound interest earns interest on interest.",
  },
  budget: {
    prompt: "You earn 6,000 zł a month. Save and invest at least 1,200 zł without cutting your basic needs too hard.",
    income: 6000,
    fixedMin: 2400,
    livingMin: 1500,
    savingsGoal: 1200,
    insight: "A common rule of thumb is 50/30/20: needs, wants and saving. Cutting needs too deep only works until stress breaks the plan.",
  },
  risk: {
    prompt: "Build a portfolio so the needle lands in the green zone for this person.",
    profileName: "Anna, 62",
    profileSummary: "Needs this capital in 3 years to retire. A big drop now would be hard to recover from.",
    horizonYears: 3,
    zoneMin: 10,
    zoneMax: 35,
    insight: "The shorter the horizon, the less time there is to recover from a crash, so risk should come down as the goal gets closer.",
  },
  estimate: {
    prompt: "A 400,000 zł loan, 25 years, 7% interest. How much interest will you pay the bank in total? No calculator.",
    unit: "zł",
    min: 0,
    max: 1_000_000,
    answer: 448_135,
    insight: "Over a long loan the interest can exceed the borrowed amount. Long-term costs are almost always underestimated.",
  },
};
