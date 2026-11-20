// components/lesson-form.tsx

"use client";

import { useRouter } from "next/navigation";
import { SubmitEvent, useState, useTransition, type ReactNode } from "react";
import { createLesson } from "@/lib/lesson/actions";
import {
  PERSONAS,
  type CreateLessonInput,
  type StepInput,
} from "@/types/lesson-input";
import type { PersonaType } from "@/types/users";

type StepType = StepInput["type"];

type OptionDraft = { key: number; label: string; isOptimal: boolean; feedback: string };

// Jeden płaski szkic kroku: po zmianie typu nic się nie gubi,
// a przy wysyłce brane są tylko pola pasujące do typu
type StepDraft = {
  key: number;
  type: StepType;
  title: string;
  narrative: string;
  explanation: string;
  keyTakeaway: string;
  scenario: string;
  summary: string;
  takeaways: string[];
  options: OptionDraft[];
};

const STEP_LABELS: Record<StepType, string> = {
  story: "Historia",
  concept: "Koncept",
  decision: "Decyzja",
  summary: "Podsumowanie",
};
const STEP_TYPES = Object.keys(STEP_LABELS) as StepType[];

let uid = 0;
const nextKey = () => ++uid;

const emptyOption = (): OptionDraft => ({
  key: nextKey(),
  label: "",
  isOptimal: false,
  feedback: "",
});

const emptyStep = (type: StepType): StepDraft => ({
  key: nextKey(),
  type,
  title: "",
  narrative: "",
  explanation: "",
  keyTakeaway: "",
  scenario: "",
  summary: "",
  takeaways: [""],
  options: [emptyOption(), emptyOption()],
});

function toStepInput(s: StepDraft): StepInput {
  switch (s.type) {
    case "story":
      return { type: "story", title: s.title, narrative: s.narrative };
    case "concept":
      return {
        type: "concept",
        title: s.title,
        explanation: s.explanation,
        keyTakeaway: s.keyTakeaway,
      };
    case "decision":
      return {
        type: "decision",
        title: s.title,
        scenario: s.scenario,
        options: s.options
          .filter((o) => o.label.trim() || o.feedback.trim())
          .map(({ label, isOptimal, feedback }) => ({ label, isOptimal, feedback })),
      };
    case "summary":
      return {
        type: "summary",
        title: s.title,
        summary: s.summary,
        keyTakeaways: s.takeaways.filter((t) => t.trim()),
      };
  }
}

const inputClass =
  "w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 font-medium text-slate-800 outline-none focus:border-sky-400";
const smallBtn =
  "rounded-xl border-2 border-b-4 border-slate-300 bg-white px-3 py-1.5 text-sm font-bold text-slate-600 hover:bg-slate-100 active:translate-y-[2px] active:border-b-2 disabled:cursor-not-allowed disabled:opacity-40";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-bold text-slate-700">{label}</span>
      {hint && <span className="text-sm font-medium text-slate-500">{hint}</span>}
      {children}
    </label>
  );
}

export function LessonForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [order, setOrder] = useState("");
  const [chapterTitle, setChapterTitle] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState("");
  const [unlockAssetId, setUnlockAssetId] = useState("");
  const [personas, setPersonas] = useState<PersonaType[]>([]);
  const [steps, setSteps] = useState<StepDraft[]>([emptyStep("story")]);

  function togglePersona(p: PersonaType) {
    setPersonas((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  }

  function updateStep(key: number, patch: Partial<StepDraft>) {
    setSteps((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  }

  function moveStep(key: number, dir: -1 | 1) {
    setSteps((prev) => {
      const i = prev.findIndex((s) => s.key === key);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const copy = [...prev];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  }

  function removeStep(key: number) {
    setSteps((prev) => prev.filter((s) => s.key !== key));
  }

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    setError(null);

    const input: CreateLessonInput = {
      order: order.trim() === "" ? null : Number(order),
      chapterTitle,
      title,
      description,
      estimatedMinutes: Number(estimatedMinutes),
      unlockAssetId: unlockAssetId.trim() === "" ? null : unlockAssetId,
      targetPersonas: personas,
      steps: steps.map(toStepInput),
    };

    startTransition(async () => {
      const result = await createLesson(input);
      if (result.ok) router.push("/lesson-map/lesson-creation");
      else setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {/* Dane lekcji */}
      <section className="flex flex-col gap-4 rounded-2xl border-2 border-slate-200 bg-white p-5">
        <h2 className="text-xl font-extrabold text-slate-800">Dane lekcji</h2>

        <Field label="Rozdział">
          <input
            required
            value={chapterTitle}
            onChange={(e) => setChapterTitle(e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Tytuł">
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Opis">
          <textarea
            required
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Szacowany czas (min)">
            <input
              required
              type="number"
              min={1}
              step={1}
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Pozycja na liście" hint="Puste = na końcu">
            <input
              type="number"
              min={0}
              step={1}
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="ID zasobu do odblokowania" hint="Opcjonalne">
          <input
            value={unlockAssetId}
            onChange={(e) => setUnlockAssetId(e.target.value)}
            className={inputClass}
          />
        </Field>

        <fieldset className="flex flex-col gap-2">
          <legend className="font-bold text-slate-700">Dla kogo</legend>
          <div className="flex flex-wrap gap-3">
            {PERSONAS.map((p) => (
              <label
                key={p}
                className="flex items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-4 py-2 font-bold text-slate-700"
              >
                <input
                  type="checkbox"
                  checked={personas.includes(p)}
                  onChange={() => togglePersona(p)}
                  className="h-5 w-5 accent-green-500"
                />
                {p}
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      {/* Kroki */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-extrabold text-slate-800">Kroki</h2>

        {steps.length === 0 && (
          <p className="font-medium text-slate-500">Brak kroków. Dodaj pierwszy poniżej.</p>
        )}

        {steps.map((step, index) => (
          <StepCard
            key={step.key}
            step={step}
            index={index}
            total={steps.length}
            onChange={(patch) => updateStep(step.key, patch)}
            onMove={(dir) => moveStep(step.key, dir)}
            onRemove={() => removeStep(step.key)}
          />
        ))}

        <div className="flex flex-wrap gap-2">
          {STEP_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setSteps((prev) => [...prev, emptyStep(t)])}
              className={smallBtn}
            >
              + {STEP_LABELS[t]}
            </button>
          ))}
        </div>
      </section>

      {error && (
        <p
          role="alert"
          className="rounded-xl border-2 border-red-300 bg-red-100 p-4 font-bold text-red-700"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-2xl border-b-4 border-green-700 bg-green-500 px-8 py-3 text-lg font-extrabold text-white active:translate-y-[2px] active:border-b-2 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-200 disabled:text-slate-400"
      >
        {isPending ? "Zapisywanie…" : "Utwórz lekcję"}
      </button>
    </form>
  );
}

function StepCard({
  step,
  index,
  total,
  onChange,
  onMove,
  onRemove,
}: {
  step: StepDraft;
  index: number;
  total: number;
  onChange: (patch: Partial<StepDraft>) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  function updateOption(key: number, patch: Partial<OptionDraft>) {
    onChange({
      options: step.options.map((o) => (o.key === key ? { ...o, ...patch } : o)),
    });
  }

  function setTakeaway(i: number, value: string) {
    onChange({ takeaways: step.takeaways.map((t, j) => (j === i ? value : t)) });
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border-2 border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="font-extrabold text-slate-800">Krok {index + 1}</span>
          <select
            value={step.type}
            onChange={(e) => onChange({ type: e.target.value as StepType })}
            aria-label={`Typ kroku ${index + 1}`}
            className="rounded-xl border-2 border-slate-300 bg-white px-3 py-1.5 font-bold text-slate-700"
          >
            {STEP_TYPES.map((t) => (
              <option key={t} value={t}>
                {STEP_LABELS[t]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            aria-label="Przesuń w górę"
            className={smallBtn}
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            aria-label="Przesuń w dół"
            className={smallBtn}
          >
            ↓
          </button>
          <button type="button" onClick={onRemove} className={smallBtn}>
            Usuń
          </button>
        </div>
      </div>

      <Field label="Tytuł kroku">
        <input
          required
          value={step.title}
          onChange={(e) => onChange({ title: e.target.value })}
          className={inputClass}
        />
      </Field>

      {step.type === "story" && (
        <Field label="Historia" hint="Krótki przykład z życia">
          <textarea
            required
            rows={5}
            value={step.narrative}
            onChange={(e) => onChange({ narrative: e.target.value })}
            className={inputClass}
          />
        </Field>
      )}

      {step.type === "concept" && (
        <>
          <Field label="Wyjaśnienie">
            <textarea
              required
              rows={5}
              value={step.explanation}
              onChange={(e) => onChange({ explanation: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Najważniejszy wniosek">
            <input
              required
              value={step.keyTakeaway}
              onChange={(e) => onChange({ keyTakeaway: e.target.value })}
              className={inputClass}
            />
          </Field>
        </>
      )}

      {step.type === "decision" && (
        <>
          <Field label="Scenariusz">
            <textarea
              required
              rows={4}
              value={step.scenario}
              onChange={(e) => onChange({ scenario: e.target.value })}
              className={inputClass}
            />
          </Field>

          <div className="flex flex-col gap-3">
            <p className="font-bold text-slate-700">Opcje (minimum 2)</p>
            {step.options.map((option, i) => (
              <div
                key={option.key}
                className="flex flex-col gap-3 rounded-xl border-2 border-slate-200 bg-slate-50 p-4"
              >
                <Field label={`Opcja ${i + 1}`}>
                  <input
                    value={option.label}
                    onChange={(e) => updateOption(option.key, { label: e.target.value })}
                    className={inputClass}
                  />
                </Field>
                <Field label="Feedback po wyborze">
                  <textarea
                    rows={2}
                    value={option.feedback}
                    onChange={(e) => updateOption(option.key, { feedback: e.target.value })}
                    className={inputClass}
                  />
                </Field>
                <div className="flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2 font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={option.isOptimal}
                      onChange={(e) => updateOption(option.key, { isOptimal: e.target.checked })}
                      className="h-5 w-5 accent-green-500"
                    />
                    Najlepsza opcja
                  </label>
                  <button
                    type="button"
                    disabled={step.options.length <= 2}
                    onClick={() =>
                      onChange({ options: step.options.filter((o) => o.key !== option.key) })
                    }
                    className={smallBtn}
                  >
                    Usuń opcję
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => onChange({ options: [...step.options, emptyOption()] })}
              className={`${smallBtn} self-start`}
            >
              + Dodaj opcję
            </button>
          </div>
        </>
      )}

      {step.type === "summary" && (
        <>
          <Field label="Podsumowanie">
            <textarea
              required
              rows={4}
              value={step.summary}
              onChange={(e) => onChange({ summary: e.target.value })}
              className={inputClass}
            />
          </Field>

          <div className="flex flex-col gap-2">
            <p className="font-bold text-slate-700">Kluczowe wnioski</p>
            {step.takeaways.map((t, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={t}
                  onChange={(e) => setTakeaway(i, e.target.value)}
                  aria-label={`Wniosek ${i + 1}`}
                  className={inputClass}
                />
                <button
                  type="button"
                  disabled={step.takeaways.length <= 1}
                  onClick={() =>
                    onChange({ takeaways: step.takeaways.filter((_, j) => j !== i) })
                  }
                  aria-label={`Usuń wniosek ${i + 1}`}
                  className={smallBtn}
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => onChange({ takeaways: [...step.takeaways, ""] })}
              className={`${smallBtn} self-start`}
            >
              + Dodaj wniosek
            </button>
          </div>
        </>
      )}
    </div>
  );
}