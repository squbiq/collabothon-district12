// Mini-symulator "czas pracuje na ciebie": ta sama miesięczna wpłata, różny wiek startu.
// Pokazuje, że o wyniku decyduje czas, a nie wysokość wpłat.
"use client";

import { useState } from "react";
import { futureValue } from "@/lib/lesson/interactive-math";
import { cn } from "@/lib/utils";

const MONTHLY = 300;
const RATE = 7; // % rocznie (nominalnie, założenie poglądowe)
const END_AGE = 65;
const FIRST = 25;

const money = (n: number) => `${Math.round(n).toLocaleString("en-US")} zł`;

export function TimeInTheMarket() {
  const [startAge, setStartAge] = useState(35);

  const early = futureValue(MONTHLY, RATE, END_AGE - FIRST);
  const mine = futureValue(MONTHLY, RATE, END_AGE - startAge);
  const paidMine = MONTHLY * 12 * (END_AGE - startAge);
  const lost = early - mine;

  return (
    <section aria-labelledby="time-heading" className="flex flex-col gap-4 rounded-2xl border-2 border-b-4 p-5">
      <div>
        <h2 id="time-heading" className="text-xl font-extrabold text-foreground">
          Time does the heavy lifting
        </h2>
        <p className="font-medium text-muted-foreground">
          {money(MONTHLY)} a month at {RATE}% a year, until age {END_AGE}. Move the slider to see what waiting costs.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between">
          <label htmlFor="start-age" className="font-bold">
            You start at
          </label>
          <output htmlFor="start-age" className="font-extrabold text-primary tabular-nums">
            age {startAge}
          </output>
        </div>
        <input
          id="start-age"
          type="range"
          min={FIRST}
          max={55}
          step={1}
          value={startAge}
          onChange={(e) => setStartAge(Number(e.target.value))}
          className="h-3 w-full cursor-pointer accent-primary"
        />
      </div>

      <Bar label={`Starting at ${FIRST}`} value={early} max={early} className="bg-green-500" />
      <Bar label={`Starting at ${startAge}`} value={mine} max={early} className="bg-sky-500" extra={`${money(paidMine)} paid in`} />

      <p aria-live="polite" className="rounded-xl bg-muted px-4 py-3 font-bold text-foreground">
        {lost > 1
          ? `Waiting ${startAge - FIRST} more years costs about ${money(lost)} – with the same monthly deposit.`
          : "Starting early means your money works the longest."}
      </p>
    </section>
  );
}

function Bar({ label, value, max, className, extra }: { label: string; value: number; max: number; className: string; extra?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between gap-2 text-sm font-bold">
        <span>{label}</span>
        <span className="tabular-nums">
          {money(value)}
          {extra && <span className="ml-2 font-medium text-muted-foreground">({extra})</span>}
        </span>
      </div>
      <div className="h-4 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-[width] duration-300 ease-out motion-reduce:transition-none", className)}
          style={{ width: `${Math.max(2, (value / max) * 100)}%` }}
        />
      </div>
    </div>
  );
}
