// Formularz zadania dziennego (tworzenie / edycja): treść, nagroda i opcje – dokładnie jedna poprawna.
"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type FormEvent } from "react";
import { AlertCircle, Plus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChunkyButton } from "@/components/shared/chunky-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { FormField } from "@/components/feature/lesson/form/form-field";
import { createDailyTask, updateDailyTask } from "@/lib/daily/admin-actions";
import type { DailyTaskForEdit } from "@/lib/daily/admin-types";

type OptionDraft = { key: number; id?: string; label: string; feedback: string };

export function DailyTaskForm({ task }: { task?: DailyTaskForEdit }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // klucze opcji w formularzu; nowe zaczynają się za kluczami opcji początkowych
  const nextKey = useRef(task ? task.options.length : 2);
  const newKey = () => nextKey.current++;
  const [category, setCategory] = useState(task?.category ?? "");
  const [title, setTitle] = useState(task?.title ?? "");
  const [scenario, setScenario] = useState(task?.scenario ?? "");
  const [rewardExp, setRewardExp] = useState(String(task?.rewardExp ?? 100));
  const [options, setOptions] = useState<OptionDraft[]>(() =>
    task
      ? task.options.map((o, i) => ({ key: i, id: o.id, label: o.label, feedback: o.feedback }))
      : [0, 1].map((key) => ({ key, label: "", feedback: "" }))
  );
  // klucz poprawnej opcji (radio = dokładnie jedna)
  const [correctKey, setCorrectKey] = useState<number>(() => {
    const i = task ? task.options.findIndex((o) => o.isOptimal) : 0;
    return i >= 0 ? i : 0;
  });

  const patch = (key: number, p: Partial<OptionDraft>) =>
    setOptions((prev) => prev.map((o) => (o.key === key ? { ...o, ...p } : o)));

  function removeOption(key: number) {
    const rest = options.filter((o) => o.key !== key);
    setOptions(rest);
    if (key === correctKey && rest[0]) setCorrectKey(rest[0].key);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const input = {
      category,
      title,
      scenario,
      rewardExp: Number(rewardExp),
      options: options.map((o) => ({ id: o.id, label: o.label, feedback: o.feedback, isOptimal: o.key === correctKey })),
    };

    startTransition(async () => {
      if (task) {
        const result = await updateDailyTask(task.id, input);
        if (!result.ok) return setError(result.error);
        toast.add({ title: "Task saved", type: "success" });
        router.refresh();
      } else {
        const result = await createDailyTask(input);
        if (!result.ok) return setError(result.error);
        router.push("/panel/daily-lesson");
      }
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label="Category" htmlFor="category" className="sm:col-span-2">
          <Input id="category" required value={category} onChange={(e) => setCategory(e.target.value)} />
        </FormField>
        <FormField label="Reward (XP)" htmlFor="rewardExp">
          <Input
            id="rewardExp"
            required
            type="number"
            min={0}
            step={1}
            value={rewardExp}
            onChange={(e) => setRewardExp(e.target.value)}
          />
        </FormField>
      </div>

      <FormField label="Title" htmlFor="title">
        <Input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} />
      </FormField>

      <FormField label="Scenario" htmlFor="scenario">
        <Textarea id="scenario" required rows={4} value={scenario} onChange={(e) => setScenario(e.target.value)} />
      </FormField>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-semibold">Options (one correct, at least 2 in total)</legend>

        {options.map((option, i) => (
          <div key={option.key} className="flex flex-col gap-3 rounded-lg border bg-muted/40 p-4">
            <FormField label={`Option ${i + 1}`} htmlFor={`option-label-${option.key}`}>
              <Input
                id={`option-label-${option.key}`}
                value={option.label}
                onChange={(e) => patch(option.key, { label: e.target.value })}
              />
            </FormField>

            <FormField label="Feedback after choosing" htmlFor={`option-feedback-${option.key}`}>
              <Textarea
                id={`option-feedback-${option.key}`}
                rows={2}
                value={option.feedback}
                onChange={(e) => patch(option.key, { feedback: e.target.value })}
              />
            </FormField>

            <div className="flex items-center justify-between gap-3">
              <Label className="flex cursor-pointer items-center gap-2 font-medium">
                <input
                  type="radio"
                  name="correct-option"
                  checked={option.key === correctKey}
                  onChange={() => setCorrectKey(option.key)}
                  className="size-4 accent-primary"
                />
                Correct answer
              </Label>
              <ChunkyButton tone="outline-primary" size="sm"
                type="button"
                disabled={options.length <= 2}
                onClick={() => removeOption(option.key)}
              >
                Remove option
              </ChunkyButton>
            </div>
          </div>
        ))}

        <ChunkyButton tone="outline-primary" size="sm" className="self-start"
          type="button"
          onClick={() => setOptions((prev) => [...prev, { key: newKey(), label: "", feedback: "" }])}
        >
          <Plus /> Add option
        </ChunkyButton>
      </fieldset>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div>
        <ChunkyButton type="submit" tone="success" size="lg" disabled={pending}>
          {pending ? "Saving…" : task ? "Save changes" : "Create task"}
        </ChunkyButton>
      </div>
    </form>
  );
}
