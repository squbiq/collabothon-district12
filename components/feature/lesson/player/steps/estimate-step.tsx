// Szacowanie na oko: suwak bez podziałki; po zatwierdzeniu animujemy różnicę względem twardej matematyki.
"use client";

import { useEffect, useState } from "react";
import type { EstimateStep as EstimateStepData } from "@/types/steps";
import { isMoneyUnit } from "@/lib/currency";
import { useMoney } from "@/components/shared/use-currency";
import { CheckButton, CurrencyRow, StepFeedback } from "./step-feedback";
import { StepText } from "./step-text";

export function EstimateStep({ step, onComplete }: { step: EstimateStepData; onComplete: () => void }) {
  const cfg = step.config;
  const { money, localize } = useMoney();
  const moneyUnit = isMoneyUnit(cfg.unit);
  const span = cfg.max - cfg.min;
  const [guess, setGuess] = useState(cfg.min + span / 2);
  const [revealed, setRevealed] = useState(false);
  // 0 → 1: postęp animacji odsłonięcia prawidłowej odpowiedzi
  const [t, setT] = useState(0);

  useEffect(() => {
    if (!revealed) return;
    // przy "reduce motion" animacja kończy się w pierwszej klatce
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1100;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = duration === 0 ? 1 : Math.min(1, (now - start) / duration);
      setT(1 - Math.pow(1 - p, 3)); // ease-out
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [revealed]);

  // jednostka walutowa (zł, €) jest przeliczana na wybraną walutę, inne jednostki zostają bez zmian
  const fmt = (n: number) => (moneyUnit ? money(n) : `${Math.round(n).toLocaleString("en-US")}${cfg.unit ? ` ${cfg.unit}` : ""}`);
  const pos = (v: number) => `${((v - cfg.min) / span) * 100}%`;
  // marker prawdziwej odpowiedzi wyjeżdża z miejsca, w którym stał strzał
  const shownAnswer = guess + (cfg.answer - guess) * t;
  const ratio = guess / cfg.answer;

  return (
    <>
      <StepText>{localize(cfg.prompt)}</StepText>
      {moneyUnit && <CurrencyRow />}

      <div className="flex flex-col gap-4 rounded-2xl border-2 p-5">
        <p className="text-center text-3xl font-extrabold text-primary tabular-nums">{fmt(guess)}</p>

        <div className="relative pt-6 pb-2">
          <input
            type="range"
            aria-label="Your estimate"
            min={cfg.min}
            max={cfg.max}
            step={span / 1000}
            value={guess}
            disabled={revealed}
            onChange={(e) => setGuess(Number(e.target.value))}
            className="h-3 w-full cursor-pointer accent-primary"
          />
          {revealed && (
            <div className="pointer-events-none absolute inset-x-0 top-0 h-full" aria-hidden>
              <div className="absolute top-0 -translate-x-1/2 text-xs font-extrabold text-green-600 dark:text-green-400" style={{ left: pos(shownAnswer) }}>
                ▼ real
              </div>
            </div>
          )}
        </div>
      </div>

      {!revealed ? (
        <CheckButton
          onClick={() => {
            setRevealed(true);
            onComplete();
          }}
        >
          Lock in my guess
        </CheckButton>
      ) : (
        <StepFeedback tone={Math.abs(ratio - 1) <= 0.15 ? "good" : "try"} title={`Real answer: ${fmt(cfg.answer * t)}`}>
          <p>
            You guessed {fmt(guess)} – that is {Math.round(ratio * 100)}% of the real value
            {Math.abs(ratio - 1) <= 0.15 ? ". Excellent calibration." : ratio < 1 ? ". Costs like this are usually underestimated." : "."}
          </p>
          <p className="mt-2">{localize(cfg.insight)}</p>
        </StepFeedback>
      )}
    </>
  );
}
