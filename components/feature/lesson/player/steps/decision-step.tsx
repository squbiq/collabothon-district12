// Case study bez kar: każdą opcję można wybrać i zobaczyć jej konsekwencje,
// a najlepsza opcja jest zaznaczona dopiero po pierwszym wyborze.
import { cn } from "@/lib/utils";
import type { DecisionStep as DecisionStepData } from "@/types/steps";
import { StepText } from "./step-text";

type Props = {
  step: DecisionStepData;
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function DecisionStep({ step, selectedId, onSelect }: Props) {
  const selected = step.options.find((o) => o.id === selectedId) ?? null;

  return (
    <>
      <StepText>{step.scenario}</StepText>

      <ul className="flex flex-col gap-3">
        {step.options.map((option) => {
          const isSelected = option.id === selectedId;
          const showOptimal = selected !== null && option.isOptimal;

          return (
            <li key={option.id}>
              <button
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelect(option.id)}
                className={cn(
                  "w-full rounded-2xl border-2 border-b-4 px-5 py-4 text-left text-lg font-bold transition-transform duration-75 outline-none focus-visible:ring-4 focus-visible:ring-ring/40 active:translate-y-0.5 active:border-b-2",
                  showOptimal
                    ? "border-green-500 bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                    : isSelected
                      ? "border-amber-400 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      : "border-border bg-card text-card-foreground hover:bg-muted"
                )}
              >
                {option.label}
              </button>
            </li>
          );
        })}
      </ul>

      <div aria-live="polite">
        {selected && (
          <div
            className={cn(
              "rounded-2xl border-2 p-5",
              selected.isOptimal
                ? "border-green-300 bg-green-100 text-green-800 dark:border-green-700 dark:bg-green-950 dark:text-green-200"
                : "border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200"
            )}
          >
            <p className="font-extrabold">
              {selected.isOptimal ? "Good choice" : "See what this means"}
            </p>
            <p className="mt-1 font-medium">{selected.feedback}</p>
          </div>
        )}
      </div>
    </>
  );
}
