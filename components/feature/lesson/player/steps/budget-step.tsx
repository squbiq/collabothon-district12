// Alokacja budżetu: pięć suwaków sumuje się do 100% – ruch jednym przesuwa pozostałe.
"use client";

import { useState } from "react";
import {
  BUDGET_KEYS,
  BUDGET_STRESS_LIMIT,
  budgetStress,
  rebalance,
  type BudgetKey,
  type BudgetShares,
} from "@/lib/lesson/interactive-math";
import { cn } from "@/lib/utils";
import type { BudgetStep as BudgetStepData } from "@/types/steps";
import { useMoney } from "@/components/shared/use-currency";
import { CheckButton, CurrencyRow, SliderRow, StepFeedback } from "./step-feedback";
import { StepText } from "./step-text";

const LABELS: Record<BudgetKey, string> = {
  fixed: "Fixed bills",
  living: "Living costs",
  fun: "Fun",
  savings: "Savings",
  invest: "Investing",
};

const START: BudgetShares = { fixed: 40, living: 25, fun: 25, savings: 5, invest: 5 };

export function BudgetStep({ step, onComplete }: { step: BudgetStepData; onComplete: () => void }) {
  const cfg = step.config;
  const { money, localize } = useMoney();
  const [shares, setShares] = useState<BudgetShares>(START);
  const [checked, setChecked] = useState(false);

  const amount = (k: BudgetKey) => (cfg.income * shares[k]) / 100;
  const saved = amount("savings") + amount("invest");
  const stress = budgetStress(cfg, shares);
  const goalMet = saved >= cfg.savingsGoal;
  const calm = stress <= BUDGET_STRESS_LIMIT;

  return (
    <>
      <StepText>{localize(cfg.prompt)}</StepText>
      <CurrencyRow />

      <div className="flex flex-col gap-4">
        {BUDGET_KEYS.map((k) => (
          <SliderRow
            key={k}
            id={`budget-${k}`}
            label={LABELS[k]}
            value={shares[k]}
            display={`${shares[k]}% · ${money(amount(k))}`}
            min={0}
            max={100}
            step={1}
            onChange={(v) => setShares((prev) => rebalance(prev, k, v))}
          />
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border-2 p-4">
        <div className="flex justify-between font-bold">
          <span>Saved + invested</span>
          <span className={cn("tabular-nums", goalMet ? "text-green-600 dark:text-green-400" : "text-foreground")}>
            {money(saved)} / {money(cfg.savingsGoal)}
          </span>
        </div>
        <div>
          <div className="mb-1 flex justify-between font-bold">
            <span>Financial stress</span>
            <span className="tabular-nums">{stress}%</span>
          </div>
          <div
            role="meter"
            aria-label="Financial stress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={stress}
            className="relative h-4 overflow-hidden rounded-full bg-muted"
          >
            <div
              className={cn(
                "h-full rounded-full transition-[width,background-color] duration-300 ease-out",
                stress > BUDGET_STRESS_LIMIT ? "bg-red-500" : stress > BUDGET_STRESS_LIMIT / 2 ? "bg-amber-400" : "bg-green-500"
              )}
              style={{ width: `${stress}%` }}
            />
            <div className="absolute inset-y-0 w-0.5 bg-foreground/60" style={{ left: `${BUDGET_STRESS_LIMIT}%` }} aria-hidden />
          </div>
        </div>
      </div>

      {!checked ? (
        <CheckButton
          onClick={() => {
            setChecked(true);
            onComplete();
          }}
        />
      ) : (
        <StepFeedback tone={goalMet && calm ? "good" : "try"} title={goalMet && calm ? "Balanced budget" : "Not balanced yet"}>
          <p>
            {goalMet && calm
              ? cfg.insight
              : !goalMet
                ? `You still need ${money(cfg.savingsGoal - saved)} more in savings or investing.`
                : "Stress is above the limit – basic needs are being cut too hard."}
          </p>
        </StepFeedback>
      )}
    </>
  );
}
