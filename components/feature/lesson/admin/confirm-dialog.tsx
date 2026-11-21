// Dialog potwierdzenia usunięcia (lekcji lub etapu).
"use client";

import { ChunkyButton } from "@/components/shared/chunky-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  pending: boolean;
  error: string | null;
  onConfirm: () => void;
};

export function ConfirmDeleteDialog({ open, onOpenChange, title, description, pending, error, onConfirm }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm font-medium text-destructive">{error}</p>}
        <DialogFooter>
          <ChunkyButton type="button" tone="outline-primary" disabled={pending} onClick={() => onOpenChange(false)}>
            Cancel
          </ChunkyButton>
          <ChunkyButton type="button" tone="danger" disabled={pending} onClick={onConfirm}>
            {pending ? "Deleting…" : "Delete"}
          </ChunkyButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
