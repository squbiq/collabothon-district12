// Suwaki przyczynowo-skutkowe: wykres wzrostu kapitału reaguje na wpłatę, wiek startu i stopę zwrotu.
"use client";

import { useState } from "react";
import { futureValue, growthSeries } from "@/lib/lesson/interactive-math";
import type { GrowthStep as GrowthStepData } from "@/types/steps";
import { useMoney } from "@/components/shared/use-currency";
import { CheckButton, CurrencyRow, SliderRow, StepFeedback } from "./step-feedback";
import { StepText } from "./step-text";

const W = 600;
const H = 260;
const PAD = { l: 8, r: 8, t: 12, b: 28 };

function Chart({ cfg, monthly, startAge, rate }: { cfg: GrowthStepData["config"]; monthly: number; startAge: number; rate: number }) {
  const { money } = useMoney();
  const series = growthSeries(cfg, monthly, startAge, rate);
  const top = Math.max(cfg.goalAmount * 1.15, ...series.map((p) => p.capital * 1.05));
  const x = (age: number) => PAD.l + ((age - cfg.startAgeMin) / (cfg.targetAge - cfg.startAgeMin)) * (W - PAD.l - PAD.r);
  const y = (v: number) => H - PAD.b - (v / top) * (H - PAD.t - PAD.b);
  const line = (key: "capital" | "paid") => series.map((p, i) => `${i ? "L" : "M"}${x(p.age).toFixed(1)} ${y(p[key]).toFixed(1)}`).join(" ");
  const last = series[series.length - 1];
  const area = `${line("capital")} L${x(last.age)} ${y(0)} L${x(series[0].age)} ${y(0)} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Capital growth chart" className="w-full rounded-2xl border-2 bg-card">
      <line x1={PAD.l} x2={W - PAD.r} y1={y(cfg.goalAmount)} y2={y(cfg.goalAmount)} className="stroke-amber-500" strokeDasharray="6 5" strokeWidth={2} />
      <text x={W - PAD.r - 4} y={y(cfg.goalAmount) - 6} textAnchor="end" className="fill-amber-600 text-[13px] font-bold dark:fill-amber-400">
        Goal {money(cfg.goalAmount)}
      </text>
      <path d={area} className="fill-primary/15" />
      <path d={line("paid")} className="fill-none stroke-muted-foreground" strokeDasharray="4 4" strokeWidth={2} />
      <path d={line("capital")} className="fill-none stroke-primary" strokeWidth={3} strokeLinejoin="round" />
      <line x1={PAD.l} x2={W - PAD.r} y1={y(0)} y2={y(0)} className="stroke-border" />
      <text x={PAD.l} y={H - 8} className="fill-muted-foreground text-[12px] font-semibold">
        age {cfg.startAgeMin}
      </text>
      <text x={W - PAD.r} y={H - 8} textAnchor="end" className="fill-muted-foreground text-[12px] font-semibold">
        age {cfg.targetAge}
      </text>
    </svg>
  );
}

export function GrowthStep({ step, onComplete }: { step: GrowthStepData; onComplete: () => void }) {
  const cfg = step.config;
  const { money, localize } = useMoney();
  const [monthly, setMonthly] = useState(Math.round((cfg.maxMonthly * 0.4) / 10) * 10);
  const [startAge, setStartAge] = useState(cfg.startAgeMax);
  const [rate, setRate] = useState((cfg.rateMin + cfg.rateMax) / 2);
  const [checked, setChecked] = useState(false);

  const capital = futureValue(monthly, rate, cfg.targetAge - startAge);
  const reached = capital >= cfg.goalAmount;
  const paid = monthly * 12 * (cfg.targetAge - startAge);

  return (
    <>
      <StepText>{localize(cfg.prompt)}</StepText>
      <CurrencyRow />
      <Chart cfg={cfg} monthly={monthly} startAge={startAge} rate={rate} />

      <p className="text-center text-sm font-semibold text-muted-foreground">
        At {cfg.targetAge} you would have{" "}
        <span className={reached ? "font-extrabold text-green-600 dark:text-green-400" : "font-extrabold text-foreground"}>{money(capital)}</span>{" "}
        ({money(paid)} paid in)
      </p>

      <div className="flex flex-col gap-4">
        <SliderRow id="growth-monthly" label="Monthly deposit" value={monthly} display={money(monthly)} min={0} max={cfg.maxMonthly} step={10} onChange={setMonthly} />
        <SliderRow id="growth-age" label="Start age" value={startAge} display={`${startAge}`} min={cfg.startAgeMin} max={cfg.startAgeMax} step={1} onChange={setStartAge} />
        <SliderRow id="growth-rate" label="Yearly return" value={rate} display={`${rate.toFixed(1)}%`} min={cfg.rateMin} max={cfg.rateMax} step={0.5} onChange={setRate} />
      </div>

      {!checked ? (
        <CheckButton
          onClick={() => {
            setChecked(true);
            onComplete();
          }}
        >
          Check
        </CheckButton>
      ) : (
        <StepFeedback tone={reached ? "good" : "try"} title={reached ? "Goal reached" : "Not there yet – keep moving the sliders"}>
          <p>{cfg.insight}</p>
        </StepFeedback>
      )}
    </>
  );
}
