// Waga ryzyka i zysku: dobór klas aktywów, tak by wskazówka trafiła w zieloną strefę dla bohatera.
"use client";

import { useState } from "react";
import {
  RISK_ASSETS,
  RISK_MAX_UNITS,
  inZone,
  portfolioScores,
  type RiskAssetId,
} from "@/lib/lesson/interactive-math";
import { cn } from "@/lib/utils";
import type { RiskStep as RiskStepData } from "@/types/steps";
import { CheckButton, StepFeedback } from "./step-feedback";
import { StepText } from "./step-text";

const CX = 150;
const CY = 150;
const R = 120;

// Punkt na łuku dla wartości 0–100 (0 = lewy koniec, 100 = prawy).
const point = (v: number, r = R) => {
  const a = Math.PI * (1 - v / 100);
  return `${(CX + r * Math.cos(a)).toFixed(1)} ${(CY - r * Math.sin(a)).toFixed(1)}`;
};
const arc = (from: number, to: number) => `M ${point(from)} A ${R} ${R} 0 0 1 ${point(to)}`;

function Bar({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-sm font-bold">
        <span>{label}</span>
        <span className="tabular-nums">{value}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-[width] duration-300 ease-out", className)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

const EMPTY: Record<RiskAssetId, number> = { cash: 0, bonds: 0, etf: 0, stocks: 0, crypto: 0 };

export function RiskStep({ step, onComplete }: { step: RiskStepData; onComplete: () => void }) {
  const cfg = step.config;
  const [units, setUnits] = useState(EMPTY);
  const [checked, setChecked] = useState(false);

  const { risk, ret, total } = portfolioScores(units);
  const good = total > 0 && inZone(cfg, risk);
  const add = (id: RiskAssetId, d: number) =>
    setUnits((prev) => ({ ...prev, [id]: Math.max(0, Math.min(RISK_MAX_UNITS, prev[id] + d)) }));

  return (
    <>
      <div className="rounded-2xl border-2 bg-muted/40 p-4">
        <p className="font-extrabold text-foreground">
          {cfg.profileName} · {cfg.horizonYears} yr horizon
        </p>
        <p className="font-medium text-foreground/80">{cfg.profileSummary}</p>
      </div>
      <StepText>{cfg.prompt}</StepText>

      <svg viewBox="0 0 300 170" role="img" aria-label={`Portfolio risk ${risk} out of 100`} className="mx-auto w-full max-w-sm">
        <path d={arc(0, 100)} className="fill-none stroke-muted" strokeWidth={18} strokeLinecap="round" />
        <path d={arc(cfg.zoneMin, cfg.zoneMax)} className="fill-none stroke-green-500" strokeWidth={18} />
        <g
          style={{
            transform: `rotate(${-90 + risk * 1.8}deg)`,
            transformOrigin: `${CX}px ${CY}px`,
            transition: "transform 450ms cubic-bezier(0.23, 1, 0.32, 1)",
          }}
        >
          <line x1={CX} y1={CY} x2={CX} y2={CY - 98} className="stroke-foreground" strokeWidth={4} strokeLinecap="round" />
        </g>
        <circle cx={CX} cy={CY} r={8} className="fill-foreground" />
        <text x={14} y={168} className="fill-muted-foreground text-[11px] font-semibold">safe</text>
        <text x={286} y={168} textAnchor="end" className="fill-muted-foreground text-[11px] font-semibold">risky</text>
      </svg>

      <div className="grid gap-3 sm:grid-cols-2">
        <Bar label="Risk" value={risk} className="bg-red-500" />
        <Bar label="Potential return" value={ret} className="bg-sky-500" />
      </div>

      <ul className="flex flex-col gap-2">
        {RISK_ASSETS.map((a) => (
          <li key={a.id} className="flex items-center gap-3 rounded-2xl border-2 px-4 py-2">
            <span className="flex-1 font-bold">{a.label}</span>
            <button
              type="button"
              aria-label={`Remove ${a.label}`}
              disabled={units[a.id] === 0}
              onClick={() => add(a.id, -1)}
              className="size-9 rounded-xl border-2 text-lg font-extrabold transition-transform duration-100 ease-out outline-none hover:bg-muted focus-visible:ring-4 focus-visible:ring-ring/40 active:scale-95 disabled:opacity-40"
            >
              −
            </button>
            <span className="w-6 text-center font-extrabold tabular-nums">{units[a.id]}</span>
            <button
              type="button"
              aria-label={`Add ${a.label}`}
              disabled={total >= RISK_MAX_UNITS}
              onClick={() => add(a.id, 1)}
              className="size-9 rounded-xl border-2 text-lg font-extrabold transition-transform duration-100 ease-out outline-none hover:bg-muted focus-visible:ring-4 focus-visible:ring-ring/40 active:scale-95 disabled:opacity-40"
            >
              +
            </button>
          </li>
        ))}
      </ul>
      <p className="text-sm font-medium text-muted-foreground">
        {total} / {RISK_MAX_UNITS} units placed on the scale.
      </p>

      {!checked ? (
        <CheckButton
          disabled={total === 0}
          onClick={() => {
            setChecked(true);
            onComplete();
          }}
        />
      ) : (
        <StepFeedback tone={good ? "good" : "try"} title={good ? "In the green zone" : risk > cfg.zoneMax ? "Too risky for this person" : "Too cautious for this person"}>
          <p>{cfg.insight}</p>
        </StepFeedback>
      )}
    </>
  );
}
