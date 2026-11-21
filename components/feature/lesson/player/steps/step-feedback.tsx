// Wspólne elementy kroków interaktywnych: panel wyniku i przycisk sprawdzania.
import { ChunkyButton } from "@/components/shared/chunky-button";
import { cn } from "@/lib/utils";

export function StepFeedback({ tone, title, children }: { tone: "good" | "try"; title: string; children: React.ReactNode }) {
  return (
    <div aria-live="polite">
      <div
        className={cn(
          "rounded-2xl border-2 p-5",
          tone === "good"
            ? "border-green-300 bg-green-100 text-green-800 dark:border-green-700 dark:bg-green-950 dark:text-green-200"
            : "border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200"
        )}
      >
        <p className="font-extrabold">{title}</p>
        <div className="mt-1 font-medium">{children}</div>
      </div>
    </div>
  );
}

export function CheckButton({ onClick, disabled, children = "Check" }: { onClick: () => void; disabled?: boolean; children?: React.ReactNode }) {
  return (
    <ChunkyButton tone="primary" className="self-start" disabled={disabled} onClick={onClick}>
      {children}
    </ChunkyButton>
  );
}

export const money = (n: number) => `${Math.round(n).toLocaleString("en-US")} zł`;

export function SliderRow({
  id,
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="font-bold text-foreground">
          {label}
        </label>
        <output htmlFor={id} className="font-extrabold text-primary tabular-nums">
          {display}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-3 w-full cursor-pointer accent-primary"
      />
    </div>
  );
}
