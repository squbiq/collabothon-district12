// Import / eksport zadań dziennych (JSON). Same ikony z tooltipem – stoją po lewej od „New task".
"use client";

import { useRef, useState, useTransition } from "react";
import { Download, FileJson, Upload } from "lucide-react";
import { ChunkyButton } from "@/components/shared/chunky-button";
import { ChubbyTooltip } from "@/components/shared/chubby-tooltip";
import { MAX_FILE_BYTES, TransferError, TransferOption, downloadJson } from "@/components/shared/transfer-ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { exportDailyTasks, importDailyTasks } from "@/lib/daily/transfer-actions";
import type { DailyTaskListItem } from "@/lib/daily/admin-types";

function ExportDialog({ tasks, onOpenChange }: { tasks: DailyTaskListItem[]; onOpenChange: (o: boolean) => void }) {
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

  function onExport() {
    setError(null);
    startTransition(async () => {
      const result = await exportDailyTasks({ ids: all ? undefined : [...selected], stripIds });
      if (!result.ok) return setError(result.error);
      downloadJson(result.filename, result.json);
      toast.add({ title: `Exported ${result.count} task(s)`, type: "success" });
      onOpenChange(false);
    });
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export daily tasks</DialogTitle>
          <DialogDescription>Download tasks as a JSON file.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <TransferOption checked={all} onChange={setAll} label="All tasks" />
          {!all && (
            <ul className="flex max-h-56 flex-col gap-2 overflow-y-auto rounded-lg border p-3" aria-label="Tasks to export">
              {tasks.map((task) => (
                <li key={task.id}>
                  <TransferOption checked={selected.has(task.id)} onChange={(v) => toggle(task.id, v)} label={task.title} />
                </li>
              ))}
              {tasks.length === 0 && <li className="text-sm text-muted-foreground">No tasks yet.</li>}
            </ul>
          )}
          <TransferOption checked={stripIds} onChange={setStripIds} label="Without IDs (portable)" hint="Task IDs are left out of the file." />
          <TransferError>{error}</TransferError>
        </div>

        <DialogFooter>
          <ChunkyButton type="button" tone="outline-primary" disabled={pending} onClick={() => onOpenChange(false)}>
            Cancel
          </ChunkyButton>
          <ChunkyButton type="button" tone="success" disabled={pending || (!all && selected.size === 0)} onClick={onExport}>
            <Download /> {pending ? "Exporting…" : "Export"}
          </ChunkyButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ImportDialog({ onOpenChange }: { onOpenChange: (o: boolean) => void }) {
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
      const result = await importDailyTasks(await file.text(), { ignoreIds });
      if (!result.ok) return setError(result.error);
      toast.add({ title: `Imported: ${result.created} new, ${result.updated} updated`, type: "success" });
      onOpenChange(false);
    });
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import daily tasks</DialogTitle>
          <DialogDescription>Choose a JSON file exported from this panel. New tasks go to the pool.</DialogDescription>
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
          <TransferOption
            checked={ignoreIds}
            onChange={setIgnoreIds}
            label="Always create new tasks (ignore IDs)"
            hint="Otherwise tasks with a matching ID are updated."
          />
          <TransferError>{error}</TransferError>
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

export function DailyTransferButtons({ tasks }: { tasks: DailyTaskListItem[] }) {
  const [dialog, setDialog] = useState<"import" | "export" | null>(null);
  const close = (open: boolean) => !open && setDialog(null);

  return (
    <>
      <ChubbyTooltip label="Export tasks" side="bottom">
        <ChunkyButton tone="outline-primary" className="size-11 px-0" aria-label="Export tasks" onClick={() => setDialog("export")}>
          <Download />
        </ChunkyButton>
      </ChubbyTooltip>
      <ChubbyTooltip label="Import tasks" side="bottom">
        <ChunkyButton tone="outline-primary" className="size-11 px-0" aria-label="Import tasks" onClick={() => setDialog("import")}>
          <Upload />
        </ChunkyButton>
      </ChubbyTooltip>

      {/* dialog montowany tylko po otwarciu – zawsze startuje z czystym stanem */}
      {dialog === "export" && <ExportDialog tasks={tasks} onOpenChange={close} />}
      {dialog === "import" && <ImportDialog onOpenChange={close} />}
    </>
  );
}
