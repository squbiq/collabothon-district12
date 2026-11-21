// Import / eksport lekcji w formacie JSON (panel admina) – każdy w osobnym dialogu z opcjami.
"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";
import { Download, FileJson, Upload } from "lucide-react";
import { ChunkyButton } from "@/components/shared/chunky-button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { exportLessons, importLessons } from "@/lib/lesson/transfer-actions";
import type { LessonTreeItem } from "@/lib/lesson/admin-queries";

// Musi mieścić się w serverActions.bodySizeLimit z next.config.ts (5 MB).
const MAX_FILE_BYTES = 4_500_000;

function downloadJson(filename: string, json: string) {
  const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function Option({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <Label className="flex cursor-pointer items-start gap-2 font-medium">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(v === true)} className="mt-0.5" />
      <span className="flex flex-col">
        {label}
        {hint && <span className="text-xs font-normal text-muted-foreground">{hint}</span>}
      </span>
    </Label>
  );
}

function ErrorText({ children }: { children: ReactNode }) {
  return children ? (
    <p role="alert" className="text-sm font-medium text-destructive">
      {children}
    </p>
  ) : null;
}

// ---------- Eksport ----------

function ExportDialog({ lessons, open, onOpenChange }: { lessons: LessonTreeItem[]; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [pending, startTransition] = useTransition();
  const [all, setAll] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [stripIds, setStripIds] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(id: string, on: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  const nothingSelected = !all && selected.size === 0;

  function onExport() {
    setError(null);
    startTransition(async () => {
      const result = await exportLessons({ ids: all ? undefined : [...selected], stripIds });
      if (!result.ok) return setError(result.error);
      downloadJson(result.filename, result.json);
      toast.add({ title: `Exported ${result.count} lesson(s)`, type: "success" });
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export lessons</DialogTitle>
          <DialogDescription>Download lessons as a JSON file.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <Option checked={all} onChange={setAll} label="All lessons" />
          {!all && (
            <ul className="flex max-h-56 flex-col gap-2 overflow-y-auto rounded-lg border p-3" aria-label="Lessons to export">
              {lessons.map((lesson) => (
                <li key={lesson.id}>
                  <Option checked={selected.has(lesson.id)} onChange={(v) => toggle(lesson.id, v)} label={lesson.title} />
                </li>
              ))}
              {lessons.length === 0 && <li className="text-sm text-muted-foreground">No lessons yet.</li>}
            </ul>
          )}
          <Option checked={stripIds} onChange={setStripIds} label="Without IDs (portable)" hint="Lesson, topic and chapter IDs are left out of the file." />
          <ErrorText>{error}</ErrorText>
        </div>

        <DialogFooter>
          <ChunkyButton type="button" tone="outline-primary" disabled={pending} onClick={() => onOpenChange(false)}>
            Cancel
          </ChunkyButton>
          <ChunkyButton type="button" tone="success" disabled={pending || nothingSelected} onClick={onExport}>
            <Download /> {pending ? "Exporting…" : "Export"}
          </ChunkyButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Import ----------

function ImportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const [ignoreIds, setIgnoreIds] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function pick(f: File | undefined) {
    setError(null);
    if (f && f.size > MAX_FILE_BYTES) {
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      return setError("The file is too large (max 4.5 MB).");
    }
    setFile(f ?? null);
  }

  function onImport() {
    if (!file) return;
    setError(null);
    startTransition(async () => {
      const result = await importLessons(await file.text(), { ignoreIds });
      if (!result.ok) return setError(result.error);
      toast.add({ title: `Imported: ${result.created} new, ${result.updated} updated`, type: "success" });
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import lessons</DialogTitle>
          <DialogDescription>Choose a JSON file exported from this panel.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => pick(e.target.files?.[0])} />
          <ChunkyButton type="button" tone="outline-primary" fullWidth disabled={pending} onClick={() => fileRef.current?.click()}>
            <FileJson /> {file ? "Change file" : "Choose file"}
          </ChunkyButton>
          {file && (
            <p className="truncate text-sm font-medium text-foreground" title={file.name}>
              {file.name} <span className="text-muted-foreground">({Math.max(1, Math.round(file.size / 1024))} KB)</span>
            </p>
          )}
          <Option
            checked={ignoreIds}
            onChange={setIgnoreIds}
            label="Always create new lessons (ignore IDs)"
            hint="Otherwise lessons with a matching ID are updated."
          />
          <ErrorText>{error}</ErrorText>
        </div>

        <DialogFooter>
          <ChunkyButton type="button" tone="outline-primary" disabled={pending} onClick={() => onOpenChange(false)}>
            Cancel
          </ChunkyButton>
          <ChunkyButton type="button" tone="success" disabled={pending || !file} onClick={onImport}>
            <Upload /> {pending ? "Importing…" : "Import"}
          </ChunkyButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Dwa przyciski w panelu bocznym; każdy otwiera swój dialog.
export function LessonTransferPanel({ lessons }: { lessons: LessonTreeItem[] }) {
  const [dialog, setDialog] = useState<"import" | "export" | null>(null);
  const close = (open: boolean) => !open && setDialog(null);

  return (
    <section className="flex flex-col gap-2 rounded-2xl border p-3" aria-label="Import and export">
      <h2 className="text-sm font-extrabold text-foreground">Import / export</h2>
      <ChunkyButton tone="outline-primary" size="sm" fullWidth onClick={() => setDialog("export")}>
        <Download /> Export
      </ChunkyButton>
      <ChunkyButton tone="outline-primary" size="sm" fullWidth onClick={() => setDialog("import")}>
        <Upload /> Import
      </ChunkyButton>

      {/* key: dialog startuje z czystym stanem po każdym otwarciu */}
      {dialog === "export" && <ExportDialog lessons={lessons} open onOpenChange={close} />}
      {dialog === "import" && <ImportDialog open onOpenChange={close} />}
    </section>
  );
}
