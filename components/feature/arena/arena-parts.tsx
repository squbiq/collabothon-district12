// components/feature/arena/arena-parts.tsx
//
// Wspólne elementy areny (walka z botem i gra online): kółka wyników, kolumna gracza, karta i przyciski odpowiedzi.
import type { ReactNode } from "react";
import { Check, X } from "lucide-react";
import { ChunkyButton } from "@/components/shared/chunky-button";
import { cn } from "@/lib/utils";

// Wygląd kółek z punktami – zmieniasz tutaj.
const DOT_BASE =
  "flex size-9 items-center justify-center rounded-full border-2 border-b-4 transition-all duration-300 sm:size-11";
const DOT_STYLES = {
  pending: "border-muted-foreground/30 bg-muted/40",
  hidden: "border-sky-700 bg-sky-500/80 text-white",
  correct: "border-green-700 bg-green-500 text-white",
  wrong: "border-red-700 bg-red-500 text-white shadow-lg shadow-red-500/40",
};

/** undefined = jeszcze bez odpowiedzi, null = odpowiedział, ale wynik jest ukryty, boolean = poprawna/błędna. */
export type DotResult = boolean | null | undefined;

function Dot({ result, active }: { result: DotResult; active: boolean }) {
  const state = result === undefined ? "pending" : result === null ? "hidden" : result ? "correct" : "wrong";
  const label = { pending: "Not answered yet", hidden: "Answered", correct: "Correct", wrong: "Wrong" }[state];
  return (
    <span role="img" aria-label={label} className={cn(DOT_BASE, DOT_STYLES[state], active && "ring-4 ring-primary/30")}>
      {state === "correct" && <Check className="size-5" strokeWidth={4} />}
      {state === "wrong" && <X className="size-5" strokeWidth={4} />}
    </span>
  );
}

export function ScoreColumn({
  label,
  icon,
  results,
  total,
  activeIndex,
  footer,
}: {
  label: string;
  icon: ReactNode;
  results: DotResult[];
  total: number;
  activeIndex: number;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-3">
      <div className="flex max-w-20 flex-col items-center gap-1 text-xs font-bold tracking-wide text-muted-foreground uppercase sm:max-w-28">
        {icon}
        <span className="max-w-full truncate">{label}</span>
      </div>
      <ol className="flex flex-col gap-3">
        {Array.from({ length: total }, (_, i) => (
          <li key={i}>
            <Dot result={results[i]} active={i === activeIndex} />
          </li>
        ))}
      </ol>
      {footer}
    </div>
  );
}

/** Karta w stylu reszty aplikacji (gruby dolny border). */
export function ArenaCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-2xl border-2 border-b-4 bg-card p-5 sm:p-6", className)}>{children}</div>;
}

export type OptionState = "idle" | "best" | "wrong" | "dim";

const OPTION_TONE = { idle: "outline-none", best: "success", wrong: "danger", dim: "outline-none" } as const;

export function OptionButton({
  label,
  state,
  disabled,
  onClick,
}: {
  label: string;
  state: OptionState;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <ChunkyButton
      type="button"
      tone={OPTION_TONE[state]}
      size="lg"
      fullWidth
      disabled={disabled}
      onClick={onClick}
      // disabled w base-ui blokuje kliknięcia; po odpowiedzi chcemy zachować pełne kolory (nie przygaszać)
      className={cn(
        "h-auto justify-start py-4 text-left text-base font-bold whitespace-normal normal-case",
        state === "dim" && "opacity-60",
        disabled && state !== "dim" && "disabled:opacity-100"
      )}
    >
      {label}
    </ChunkyButton>
  );
}

export function ErrorLine({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-sm font-medium text-red-500">
      {message}
    </p>
  );
}
