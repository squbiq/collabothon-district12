// Import / eksport lekcji w formacie JSON (panel admina).
"use client";

import { useRef, useState, useTransition } from "react";
import { Download, Upload } from "lucide-react";
import { ChunkyButton } from "@/components/shared/chunky-button";
import { exportLessons, importLessons } from "@/lib/lesson/transfer-actions";

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

type Message = { kind: "ok" | "error"; text: string };

function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-primary" />
      {label}
    </label>
  );
}

function Feedback({ message }: { message: Message | null }) {
  if (!message) return null;
  return (
    <p role="status" className={`text-xs font-medium ${message.kind === "error" ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"}`}>
      {message.text}
    </p>
  );
}

// Eksport jednej lekcji (używany na stronie edycji) – ID lekcji zostają w pliku.
export function ExportLessonButton({ lessonId }: { lessonId: string }) {
  const [pending, startTransition] = useTransition();
  const [stripIds, setStripIds] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  function onExport() {
    setMessage(null);
    startTransition(async () => {
      const result = await exportLessons({ ids: [lessonId], stripIds });
      if (!result.ok) return setMessage({ kind: "error", text: result.error });
      downloadJson(result.filename, result.json);
    });
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <ChunkyButton tone="outline-primary" size="sm" disabled={pending} onClick={onExport}>
        <Download /> Export JSON
      </ChunkyButton>
      <Checkbox checked={stripIds} onChange={setStripIds} label="Without IDs (portable)" />
      <Feedback message={message} />
    </div>
  );
}

export function LessonTransferPanel() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [stripIds, setStripIds] = useState(false);
  const [ignoreIds, setIgnoreIds] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  function onExport() {
    setMessage(null);
    startTransition(async () => {
      const result = await exportLessons({ stripIds });
      if (!result.ok) return setMessage({ kind: "error", text: result.error });
      downloadJson(result.filename, result.json);
      setMessage({ kind: "ok", text: `Exported ${result.count} lesson(s).` });
    });
  }

  function onFile(file: File | undefined) {
    if (!file) return;
    setMessage(null);
    if (file.size > MAX_FILE_BYTES) return setMessage({ kind: "error", text: "The file is too large (max 4.5 MB)." });

    startTransition(async () => {
      const result = await importLessons(await file.text(), { ignoreIds });
      if (fileRef.current) fileRef.current.value = ""; // pozwala wybrać ten sam plik ponownie
      if (!result.ok) return setMessage({ kind: "error", text: result.error });
      setMessage({ kind: "ok", text: `Imported: ${result.created} new, ${result.updated} updated.` });
    });
  }

  return (
    <section className="flex flex-col gap-2 rounded-2xl border p-3" aria-label="Import and export">
      <h2 className="text-sm font-extrabold text-foreground">Import / export</h2>

      <ChunkyButton tone="outline-primary" size="sm" fullWidth disabled={pending} onClick={onExport}>
        <Download /> Export all
      </ChunkyButton>
      <Checkbox checked={stripIds} onChange={setStripIds} label="Without IDs (portable)" />

      <ChunkyButton tone="outline-primary" size="sm" fullWidth disabled={pending} onClick={() => fileRef.current?.click()}>
        <Upload /> Import JSON
      </ChunkyButton>
      <Checkbox checked={ignoreIds} onChange={setIgnoreIds} label="Always create new lessons (ignore IDs)" />
      <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => onFile(e.target.files?.[0])} />

      <Feedback message={message} />
    </section>
  );
}
