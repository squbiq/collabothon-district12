// Import / eksport użytkowników (JSON). Same ikony z tooltipem, jak przy zadaniach dziennych.
"use client";

import { useRef, useState, useTransition } from "react";
import { Download, FileJson, Upload } from "lucide-react";
import { ChunkyButton } from "@/components/shared/chunky-button";
import { ChubbyTooltip } from "@/components/shared/chubby-tooltip";
import { MAX_FILE_BYTES, TransferError, TransferOption, downloadJson } from "@/components/shared/transfer-ui";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { exportUsers, importUsers } from "@/lib/users/transfer-actions";

function ExportDialog({ onOpenChange }: { onOpenChange: (o: boolean) => void }) {
  const [pending, startTransition] = useTransition();
  const [includePasswords, setIncludePasswords] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function onExport() {
    setError(null);
    startTransition(async () => {
      const result = await exportUsers({ includePasswords });
      if (!result.ok) return setError(result.error);
      downloadJson(result.filename, result.json);
      toast.add({ type: "success", title: `Exported ${result.count} user(s)` });
      onOpenChange(false);
    });
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export users</DialogTitle>
          <DialogDescription>
            Accounts with progress and Arena duels. Sessions are not exported, so users must log in again after an import.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <TransferOption
            checked={includePasswords}
            onChange={setIncludePasswords}
            label="Include password hashes"
            hint="Needed to keep logins working after an import. The file is sensitive – store it safely."
          />
          <TransferError>{error}</TransferError>
        </div>
        <DialogFooter>
          <ChunkyButton type="button" tone="outline-primary" disabled={pending} onClick={() => onOpenChange(false)}>
            Cancel
          </ChunkyButton>
          <ChunkyButton type="button" tone="success" disabled={pending} onClick={onExport}>
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
  const [overwrite, setOverwrite] = useState(false);
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
      const result = await importUsers(await file.text(), { overwrite });
      if (!result.ok) return setError(result.error);
      toast.add({
        type: "success",
        title: `Imported: ${result.created} new, ${result.updated} updated, ${result.skipped} skipped`,
        description: result.droppedProgress > 0 ? `${result.droppedProgress} progress entries were skipped (lesson no longer exists).` : undefined,
      });
      onOpenChange(false);
    });
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import users</DialogTitle>
          <DialogDescription>Choose a JSON file exported from this panel. Imported users have to log in again.</DialogDescription>
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
            checked={overwrite}
            onChange={setOverwrite}
            label="Overwrite existing users"
            hint="Users with a matching ID are replaced. Otherwise they are skipped. Your own account is never changed."
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

export function UsersTransferButtons() {
  const [dialog, setDialog] = useState<"import" | "export" | null>(null);
  const close = (open: boolean) => !open && setDialog(null);

  return (
    <>
      <ChubbyTooltip label="Export users" side="bottom">
        <ChunkyButton tone="outline-primary" className="size-11 px-0" aria-label="Export users" onClick={() => setDialog("export")}>
          <Download />
        </ChunkyButton>
      </ChubbyTooltip>
      <ChubbyTooltip label="Import users" side="bottom">
        <ChunkyButton tone="outline-primary" className="size-11 px-0" aria-label="Import users" onClick={() => setDialog("import")}>
          <Upload />
        </ChunkyButton>
      </ChubbyTooltip>
      {dialog === "export" && <ExportDialog onOpenChange={close} />}
      {dialog === "import" && <ImportDialog onOpenChange={close} />}
    </>
  );
}
