// Pola formularza dla kroków interaktywnych (growth / budget / risk / estimate).
import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "../form-field";
import type { StepFieldsProps } from "./types";

// Liczba w stanie formularza; puste pole = 0 (serwer odrzuci to, jeśli wartość jest niedozwolona).
function NumberField({
  id,
  label,
  hint,
  value,
  onChange,
  step = 1,
}: {
  id: string;
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <FormField label={label} hint={hint} htmlFor={id}>
      <Input
        id={id}
        type="number"
        step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(e.target.valueAsNumber || 0)}
      />
    </FormField>
  );
}

function TextField({ id, label, rows = 3, value, onChange }: { id: string; label: string; rows?: number; value: string; onChange: (v: string) => void }) {
  return (
    <FormField label={label} htmlFor={id}>
      <Textarea id={id} required rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
    </FormField>
  );
}

const Grid = ({ children }: { children: ReactNode }) => <div className="grid gap-4 sm:grid-cols-2">{children}</div>;

export function GrowthFields({ step, onChange }: StepFieldsProps) {
  const c = step.growth;
  const set = (patch: Partial<typeof c>) => onChange({ growth: { ...c, ...patch } });
  return (
    <>
      <TextField id="g-prompt" label="Task" value={c.prompt} onChange={(prompt) => set({ prompt })} />
      <Grid>
        <NumberField id="g-goal" label="Goal (€)" value={c.goalAmount} onChange={(goalAmount) => set({ goalAmount })} />
        <NumberField id="g-target" label="Target age" value={c.targetAge} onChange={(targetAge) => set({ targetAge })} />
        <NumberField id="g-max" label="Max monthly deposit (€)" hint="Slider limit" value={c.maxMonthly} onChange={(maxMonthly) => set({ maxMonthly })} />
        <span />
        <NumberField id="g-age-min" label="Earliest start age" value={c.startAgeMin} onChange={(startAgeMin) => set({ startAgeMin })} />
        <NumberField id="g-age-max" label="Latest start age" value={c.startAgeMax} onChange={(startAgeMax) => set({ startAgeMax })} />
        <NumberField id="g-rate-min" label="Lowest yearly return (%)" step={0.5} value={c.rateMin} onChange={(rateMin) => set({ rateMin })} />
        <NumberField id="g-rate-max" label="Highest yearly return (%)" step={0.5} value={c.rateMax} onChange={(rateMax) => set({ rateMax })} />
      </Grid>
      <TextField id="g-insight" label="Lesson shown after checking" value={c.insight} onChange={(insight) => set({ insight })} />
    </>
  );
}

export function BudgetFields({ step, onChange }: StepFieldsProps) {
  const c = step.budget;
  const set = (patch: Partial<typeof c>) => onChange({ budget: { ...c, ...patch } });
  return (
    <>
      <TextField id="b-prompt" label="Task" value={c.prompt} onChange={(prompt) => set({ prompt })} />
      <Grid>
        <NumberField id="b-income" label="Monthly income (€)" value={c.income} onChange={(income) => set({ income })} />
        <NumberField id="b-goal" label="Savings + investing goal (€)" value={c.savingsGoal} onChange={(savingsGoal) => set({ savingsGoal })} />
        <NumberField id="b-fixed" label="Fixed bills minimum (€)" hint="Below it stress rises" value={c.fixedMin} onChange={(fixedMin) => set({ fixedMin })} />
        <NumberField id="b-living" label="Living costs minimum (€)" hint="Below it stress rises" value={c.livingMin} onChange={(livingMin) => set({ livingMin })} />
      </Grid>
      <TextField id="b-insight" label="Lesson shown after checking" value={c.insight} onChange={(insight) => set({ insight })} />
    </>
  );
}

export function RiskFields({ step, onChange }: StepFieldsProps) {
  const c = step.risk;
  const set = (patch: Partial<typeof c>) => onChange({ risk: { ...c, ...patch } });
  return (
    <>
      <TextField id="r-prompt" label="Task" rows={2} value={c.prompt} onChange={(prompt) => set({ prompt })} />
      <Grid>
        <FormField label="Person" htmlFor="r-name">
          <Input id="r-name" required value={c.profileName} onChange={(e) => set({ profileName: e.target.value })} />
        </FormField>
        <NumberField id="r-horizon" label="Time horizon (years)" value={c.horizonYears} onChange={(horizonYears) => set({ horizonYears })} />
        <NumberField id="r-zmin" label="Green zone from (0–100)" hint="Risk scale" value={c.zoneMin} onChange={(zoneMin) => set({ zoneMin })} />
        <NumberField id="r-zmax" label="Green zone to (0–100)" value={c.zoneMax} onChange={(zoneMax) => set({ zoneMax })} />
      </Grid>
      <TextField id="r-summary" label="Person's situation" rows={2} value={c.profileSummary} onChange={(profileSummary) => set({ profileSummary })} />
      <TextField id="r-insight" label="Lesson shown after checking" value={c.insight} onChange={(insight) => set({ insight })} />
    </>
  );
}

export function EstimateFields({ step, onChange }: StepFieldsProps) {
  const c = step.estimate;
  const set = (patch: Partial<typeof c>) => onChange({ estimate: { ...c, ...patch } });
  return (
    <>
      <TextField id="e-prompt" label="Question" value={c.prompt} onChange={(prompt) => set({ prompt })} />
      <Grid>
        <NumberField id="e-answer" label="Correct answer" value={c.answer} onChange={(answer) => set({ answer })} />
        <FormField label="Unit" htmlFor="e-unit">
          <Input id="e-unit" value={c.unit} maxLength={20} onChange={(e) => set({ unit: e.target.value })} />
        </FormField>
        <NumberField id="e-min" label="Slider minimum" value={c.min} onChange={(min) => set({ min })} />
        <NumberField id="e-max" label="Slider maximum" value={c.max} onChange={(max) => set({ max })} />
      </Grid>
      <TextField id="e-insight" label="Lesson shown after the reveal" value={c.insight} onChange={(insight) => set({ insight })} />
    </>
  );
}
