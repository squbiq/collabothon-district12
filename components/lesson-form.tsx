"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useState,
  useTransition,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  FilePlus2,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// Załóżmy, że te funkcje i typy dopiszesz w swoich plikach
import {
  createLesson,
  getChapters,
  getLessonById,
  getLessonsByChapter,
  updateLesson,
} from "@/lib/lesson/actions";
import {
  PERSONAS,
  type ChapterOption,
  type CreateLessonInput,
  type LessonSummary,
  type StepInput,
} from "@/types/lesson-input";
import type { PersonaType } from "@/types/users";

type StepType = StepInput["type"];

type OptionDraft = {
  key: number;
  label: string;
  isOptimal: boolean;
  feedback: string;
};

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

// Zamiana szkicu formularza -> format wysyłany do API
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
          .map(({ label, isOptimal, feedback }) => ({
            label,
            isOptimal,
            feedback,
          })),
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

// Zamiana danych z API -> szkic formularza (potrzebne przy edycji)
function fromStepInput(step: StepInput): StepDraft {
  const base = emptyStep(step.type);
  base.title = step.title;

  switch (step.type) {
    case "story":
      base.narrative = step.narrative;
      break;
    case "concept":
      base.explanation = step.explanation;
      base.keyTakeaway = step.keyTakeaway;
      break;
    case "decision":
      base.scenario = step.scenario;
      base.options =
        step.options.length > 0
          ? step.options.map((o) => ({
              key: nextKey(),
              label: o.label,
              isOptimal: o.isOptimal,
              feedback: o.feedback,
            }))
          : [emptyOption(), emptyOption()];
      break;
    case "summary":
      base.summary = step.summary;
      base.takeaways =
        step.keyTakeaways.length > 0 ? [...step.keyTakeaways] : [""];
      break;
  }

  return base;
}

function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={htmlFor} className="font-semibold">
          {label}
        </Label>
        {hint && (
          <span className="text-xs text-muted-foreground">{hint}</span>
        )}
      </div>
      {children}
    </div>
  );
}

export function LessonForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // --- Stany dla wyboru rozdziału i edytowanej lekcji ---
  const [chapters, setChapters] = useState<ChapterOption[]>([]);
  const [lessonsInChapter, setLessonsInChapter] = useState<LessonSummary[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string>("");
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);

  const [isLoadingChapters, setIsLoadingChapters] = useState(true);
  const [isLoadingLessons, setIsLoadingLessons] = useState(false);
  const [isLoadingLessonData, setIsLoadingLessonData] = useState(false);

  // --- Stany pól formularza ---
  const [order, setOrder] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState("");
  const [unlockAssetId, setUnlockAssetId] = useState("");
  const [personas, setPersonas] = useState<PersonaType[]>([]);
  const [steps, setSteps] = useState<StepDraft[]>([emptyStep("story")]);

  // 1. Pobierz listę rozdziałów przy starcie
  useEffect(() => {
    let active = true;
    getChapters()
      .then((data) => {
        if (active) setChapters(data);
      })
      .catch(() => {
        if (active) setError("Nie udało się pobrać listy rozdziałów.");
      })
      .finally(() => {
        if (active) setIsLoadingChapters(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Resetowanie formularza do trybu tworzenia nowej lekcji
  function resetToNewLesson() {
    setEditingLessonId(null);
    setSelectedChapterId("");
    setLessonsInChapter([]);
    setOrder("");
    setChapterId("");
    setTitle("");
    setDescription("");
    setEstimatedMinutes("");
    setUnlockAssetId("");
    setPersonas([]);
    setSteps([emptyStep("story")]);
    setError(null);
  }

  // 2. Obsługa wyboru rozdziału -> pobiera jego lekcje
  async function handleChapterSelect(chapterId: string | null) {
    if (!chapterId) return;
    setSelectedChapterId(chapterId);
    setEditingLessonId(null);
    setLessonsInChapter([]);
    setError(null);

    const chosenChapter = chapters.find((c) => c.id === chapterId);
    if (chosenChapter) {
      setChapterId(chosenChapter.title);
    }

    setIsLoadingLessons(true);
    try {
      const data = await getLessonsByChapter(chapterId);
      setLessonsInChapter(data);
    } catch {
      setError("Nie udało się pobrać lekcji z wybranego rozdziału.");
    } finally {
      setIsLoadingLessons(false);
    }
  }

  // 3. Obsługa wyboru lekcji -> pobiera jej pełne dane i wypełnia pola
  async function handleLessonSelect(lessonId: string | null) {
    if (!lessonId) return;
    setEditingLessonId(lessonId);
    setError(null);
    setIsLoadingLessonData(true);

    try {
      const lesson = await getLessonById(lessonId);
      if (!lesson) {
        setError("Nie znaleziono wybranej lekcji.");
        return;
      }

      setOrder(lesson.order !== null ? String(lesson.order) : "");
      setChapterId(lesson.chapterId);
      setTitle(lesson.title);
      setDescription(lesson.description);
      setEstimatedMinutes(String(lesson.estimatedMinutes));
      setUnlockAssetId(lesson.unlockAssetId ?? "");
      setPersonas(lesson.targetPersonas);
      setSteps(
        lesson.steps.length > 0
          ? lesson.steps.map(fromStepInput)
          : [emptyStep("story")]
      );
    } catch {
      setError("Błąd podczas wczytywania danych lekcji.");
    } finally {
      setIsLoadingLessonData(false);
    }
  }

  function togglePersona(p: PersonaType) {
    setPersonas((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  function updateStep(key: number, patch: Partial<StepDraft>) {
    setSteps((prev) =>
      prev.map((s) => (s.key === key ? { ...s, ...patch } : s))
    );
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

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const input: CreateLessonInput = {
      order: order.trim() === "" ? null : Number(order),
      chapterId,
      title,
      description,
      estimatedMinutes: Number(estimatedMinutes),
      unlockAssetId: unlockAssetId.trim() === "" ? null : unlockAssetId,
      targetPersonas: personas,
      steps: steps.map(toStepInput),
    };

    startTransition(async () => {
      const result = editingLessonId
        ? await updateLesson(editingLessonId, input)
        : await createLesson(input);

      if (result.ok) {
        router.push("/lesson-map/lesson-creation");
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-8 items-start">
      {/* Panel wyboru trybu: Nowa lekcja vs Edycja istniejącej */}
      <Card className="border-dashed bg-muted/30">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-lg">
                {editingLessonId
                  ? "Tryb edycji lekcji"
                  : "Tworzenie nowej lekcji"}
              </CardTitle>
              <CardDescription>
                Wybierz rozdział i lekcję, aby ją zmodyfikować, lub wypełnij
                formularz poniżej, aby dodać nową.
              </CardDescription>
            </div>

            {(selectedChapterId || editingLessonId) && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={resetToNewLesson}
              >
                <FilePlus2 className="mr-1.5 h-4 w-4" />
                Nowa lekcja
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Wybór rozdziału */}
            <Field label="1. Wybierz rozdział" htmlFor="select-chapter">
              <Select
                value={selectedChapterId}
                onValueChange={handleChapterSelect}
                disabled={isLoadingChapters}
              >
                <SelectTrigger id="select-chapter" className="bg-background">
                  <SelectValue
                    placeholder={
                      isLoadingChapters
                        ? "Ładowanie rozdziałów..."
                        : "Wybierz rozdział z listy"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {chapters.map((chapter) => (
                    <SelectItem key={chapter.id} value={chapter.id}>
                      {chapter.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {/* Wybór lekcji w rozdziale */}
            <Field label="2. Wybierz lekcję do edycji" htmlFor="select-lesson">
              <Select
                value={editingLessonId ?? ""}
                onValueChange={handleLessonSelect}
                disabled={!selectedChapterId || isLoadingLessons}
              >
                <SelectTrigger id="select-lesson" className="bg-background">
                  <SelectValue
                    placeholder={
                      !selectedChapterId
                        ? "Najpierw wybierz rozdział"
                        : isLoadingLessons
                        ? "Ładowanie lekcji..."
                        : lessonsInChapter.length === 0
                        ? "Brak lekcji w tym rozdziale"
                        : "Wybierz lekcję..."
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {lessonsInChapter.map((lesson) => (
                    <SelectItem key={lesson.id} value={lesson.id}>
                      {lesson.order !== null ? `${lesson.order}. ` : ""}
                      {lesson.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* Wskaźnik ładowania przy wczytywaniu edytowanej lekcji */}
      {isLoadingLessonData ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border bg-card py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Wczytywanie danych lekcji...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          {/* Dane lekcji */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Dane lekcji</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Field label="Rozdział" htmlFor="chapterTitle">
                <Input
                  id="chapterId"
                  required
                  value={chapterId}
                  onChange={(e) => setChapterId(e.target.value)}
                />
              </Field>

              <Field label="Tytuł" htmlFor="title">
                <Input
                  id="title"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </Field>

              <Field label="Opis" htmlFor="description">
                <Textarea
                  id="description"
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Szacowany czas (min)" htmlFor="estimatedMinutes">
                  <Input
                    id="estimatedMinutes"
                    required
                    type="number"
                    min={1}
                    step={1}
                    value={estimatedMinutes}
                    onChange={(e) => setEstimatedMinutes(e.target.value)}
                  />
                </Field>

                <Field
                  label="Pozycja na liście"
                  hint="Puste = na końcu"
                  htmlFor="order"
                >
                  <Input
                    id="order"
                    type="number"
                    min={0}
                    step={1}
                    value={order}
                    onChange={(e) => setOrder(e.target.value)}
                  />
                </Field>
              </div>

              <Field
                label="ID zasobu do odblokowania"
                hint="Opcjonalne"
                htmlFor="unlockAssetId"
              >
                <Input
                  id="unlockAssetId"
                  value={unlockAssetId}
                  onChange={(e) => setUnlockAssetId(e.target.value)}
                />
              </Field>

              <fieldset className="flex flex-col gap-2">
                <legend className="text-sm font-semibold">Dla kogo</legend>
                <div className="flex flex-wrap gap-3">
                  {PERSONAS.map((p) => {
                    const checkboxId = `persona-${p}`;
                    return (
                      <Label
                        key={p}
                        htmlFor={checkboxId}
                        className="flex cursor-pointer items-center gap-2 rounded-lg border px-3.5 py-2 font-medium transition-colors hover:bg-muted/50"
                      >
                        <Checkbox
                          id={checkboxId}
                          checked={personas.includes(p)}
                          onCheckedChange={() => togglePersona(p)}
                        />
                        {p}
                      </Label>
                    );
                  })}
                </div>
              </fieldset>
            </CardContent>
          </Card>

          {/* Kroki */}
          <section className="flex flex-col gap-4">
            <h2 className="text-xl font-bold tracking-tight">Kroki</h2>

            {steps.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Brak kroków. Dodaj pierwszy poniżej.
              </p>
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
                <Button
                  key={t}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSteps((prev) => [...prev, emptyStep(t)])}
                >
                  <Plus className="mr-1.5 h-4 w-4" />
                  {STEP_LABELS[t]}
                </Button>
              ))}
            </div>
          </section>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              size="lg"
              disabled={isPending}
              className="w-full sm:w-auto"
            >
              {isPending
                ? "Zapisywanie…"
                : editingLessonId
                ? "Zapisz zmiany"
                : "Utwórz lekcję"}
            </Button>

            {editingLessonId && (
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={isPending}
                onClick={resetToNewLesson}
                className="w-full sm:w-auto"
              >
                Anuluj edycję
              </Button>
            )}
          </div>
        </form>
      )}
    </div>
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
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <CardTitle className="text-base font-bold">
            Krok {index + 1}
          </CardTitle>
          <Select
            value={step.type}
            onValueChange={(value) => onChange({ type: value as StepType })}
          >
            <SelectTrigger
              className="w-40"
              aria-label={`Typ kroku ${index + 1}`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STEP_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {STEP_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            aria-label="Przesuń w górę"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            aria-label="Przesuń w dół"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="mr-1.5 h-4 w-4" />
            Usuń
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <Field label="Tytuł kroku" htmlFor={`step-title-${step.key}`}>
          <Input
            id={`step-title-${step.key}`}
            required
            value={step.title}
            onChange={(e) => onChange({ title: e.target.value })}
          />
        </Field>

        {step.type === "story" && (
          <Field
            label="Historia"
            hint="Krótki przykład z życia"
            htmlFor={`step-narrative-${step.key}`}
          >
            <Textarea
              id={`step-narrative-${step.key}`}
              required
              rows={5}
              value={step.narrative}
              onChange={(e) => onChange({ narrative: e.target.value })}
            />
          </Field>
        )}

        {step.type === "concept" && (
          <>
            <Field
              label="Wyjaśnienie"
              htmlFor={`step-explanation-${step.key}`}
            >
              <Textarea
                id={`step-explanation-${step.key}`}
                required
                rows={5}
                value={step.explanation}
                onChange={(e) => onChange({ explanation: e.target.value })}
              />
            </Field>
            <Field
              label="Najważniejszy wniosek"
              htmlFor={`step-takeaway-${step.key}`}
            >
              <Input
                id={`step-takeaway-${step.key}`}
                required
                value={step.keyTakeaway}
                onChange={(e) => onChange({ keyTakeaway: e.target.value })}
              />
            </Field>
          </>
        )}

        {step.type === "decision" && (
          <>
            <Field label="Scenariusz" htmlFor={`step-scenario-${step.key}`}>
              <Textarea
                id={`step-scenario-${step.key}`}
                required
                rows={4}
                value={step.scenario}
                onChange={(e) => onChange({ scenario: e.target.value })}
              />
            </Field>

            <div className="flex flex-col gap-3">
              <Label className="font-semibold">Opcje (minimum 2)</Label>
              {step.options.map((option, i) => {
                const optimalId = `optimal-${option.key}`;
                return (
                  <div
                    key={option.key}
                    className="flex flex-col gap-3 rounded-lg border bg-muted/40 p-4"
                  >
                    <Field
                      label={`Opcja ${i + 1}`}
                      htmlFor={`option-label-${option.key}`}
                    >
                      <Input
                        id={`option-label-${option.key}`}
                        value={option.label}
                        onChange={(e) =>
                          updateOption(option.key, { label: e.target.value })
                        }
                      />
                    </Field>

                    <Field
                      label="Feedback po wyborze"
                      htmlFor={`option-feedback-${option.key}`}
                    >
                      <Textarea
                        id={`option-feedback-${option.key}`}
                        rows={2}
                        value={option.feedback}
                        onChange={(e) =>
                          updateOption(option.key, { feedback: e.target.value })
                        }
                      />
                    </Field>

                    <div className="flex items-center justify-between gap-3">
                      <Label
                        htmlFor={optimalId}
                        className="flex cursor-pointer items-center gap-2 font-medium"
                      >
                        <Checkbox
                          id={optimalId}
                          checked={option.isOptimal}
                          onCheckedChange={(checked) =>
                            updateOption(option.key, {
                              isOptimal: checked === true,
                            })
                          }
                        />
                        Najlepsza opcja
                      </Label>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={step.options.length <= 2}
                        onClick={() =>
                          onChange({
                            options: step.options.filter(
                              (o) => o.key !== option.key
                            ),
                          })
                        }
                      >
                        Usuń opcję
                      </Button>
                    </div>
                  </div>
                );
              })}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  onChange({ options: [...step.options, emptyOption()] })
                }
                className="self-start"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Dodaj opcję
              </Button>
            </div>
          </>
        )}

        {step.type === "summary" && (
          <>
            <Field label="Podsumowanie" htmlFor={`step-summary-${step.key}`}>
              <Textarea
                id={`step-summary-${step.key}`}
                required
                rows={4}
                value={step.summary}
                onChange={(e) => onChange({ summary: e.target.value })}
              />
            </Field>

            <div className="flex flex-col gap-2">
              <Label className="font-semibold">Kluczowe wnioski</Label>
              {step.takeaways.map((t, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={t}
                    onChange={(e) => setTakeaway(i, e.target.value)}
                    aria-label={`Wniosek ${i + 1}`}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={step.takeaways.length <= 1}
                    onClick={() =>
                      onChange({
                        takeaways: step.takeaways.filter((_, j) => j !== i),
                      })
                    }
                    aria-label={`Usuń wniosek ${i + 1}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  onChange({ takeaways: [...step.takeaways, ""] })
                }
                className="self-start"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Dodaj wniosek
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}