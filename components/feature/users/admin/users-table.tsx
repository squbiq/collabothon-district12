// Lista użytkowników z akcjami admina: ban/odbanowanie, rola, sesje, hasło, usuwanie.
"use client";

import { useState, useTransition } from "react";
import { Ban, KeyRound, LogOut, MoreHorizontal, ShieldCheck, ShieldOff, Trash2, Undo2 } from "lucide-react";
import { ChunkyButton } from "@/components/shared/chunky-button";
import { TransferError } from "@/components/shared/transfer-ui";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { banUser, removeUser, revokeUserSessions, setUserPassword, setUserRole, unbanUser } from "@/lib/users/actions";
import type { ActionResult, AdminUserItem } from "@/lib/users/types";

const DURATIONS = [
  { value: "1", label: "1 day" },
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "permanent", label: "Permanent" },
];

const formatDate = (iso: string) =>
  `${new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" })} UTC`;

type Dialogs = { kind: "ban" | "password" | "delete"; user: AdminUserItem } | null;

function isActiveBan(u: AdminUserItem) {
  return u.banned && (!u.banExpires || new Date(u.banExpires).getTime() > Date.now());
}

export function UsersTable({ users, currentUserId }: { users: AdminUserItem[]; currentUserId: string }) {
  const [pending, startTransition] = useTransition();
  const [dialog, setDialog] = useState<Dialogs>(null);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState("7");
  const [password, setPassword] = useState("");

  function open(kind: NonNullable<Dialogs>["kind"], user: AdminUserItem) {
    setError(null);
    setReason("");
    setDuration("7");
    setPassword("");
    setDialog({ kind, user });
  }

  /** Wykonuje akcję; sukces = tost (+ zamknięcie dialogu), błąd = tost albo komunikat w dialogu. */
  function run(action: () => Promise<ActionResult>, success: string, inDialog = false) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        if (inDialog) setError(result.error);
        else toast.add({ type: "error", title: result.error });
        return;
      }
      toast.add({ type: "success", title: success });
      setDialog(null);
    });
  }

  if (users.length === 0) return <p className="text-muted-foreground">No users found.</p>;

  return (
    <>
      <ul className="flex flex-col gap-2">
        {users.map((u) => {
          const self = u.id === currentUserId;
          const admin = u.role.split(",").map((r) => r.trim()).includes("admin");
          const banned = isActiveBan(u);
          return (
            <li key={u.id} className="flex items-center gap-3 rounded-xl border p-3">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-bold text-foreground" title={u.name}>
                    {u.username ?? u.name}
                  </span>
                  {admin && (
                    <Badge className="gap-1">
                      <ShieldCheck className="size-3" /> Admin
                    </Badge>
                  )}
                  {banned && <Badge variant="destructive">Banned</Badge>}
                  {self && <Badge variant="outline">You</Badge>}
                </div>
                <span className="truncate text-sm text-muted-foreground" title={u.email}>
                  {u.email}
                </span>
                <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                  <span>{u.experience} XP</span>
                  <span>{u.streak} day streak</span>
                  <span>{u.sessionCount} session(s)</span>
                  <span>Joined {formatDate(u.createdAt)}</span>
                </div>
                {banned && (
                  <p className="text-xs text-destructive">
                    {u.banReason || "No reason given"} · {u.banExpires ? `until ${formatDate(u.banExpires)}` : "permanent"}
                  </p>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label={`Actions for ${u.email}`}
                  className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <MoreHorizontal className="size-5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-52">
                  {banned ? (
                    <DropdownMenuItem onClick={() => run(() => unbanUser(u.id), "User unbanned.")}>
                      <Undo2 /> Unban
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem disabled={self} onClick={() => open("ban", u)}>
                      <Ban /> Ban…
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    disabled={self}
                    onClick={() => run(() => setUserRole(u.id, admin ? "user" : "admin"), admin ? "Admin role removed." : "User is now an admin.")}
                  >
                    {admin ? <ShieldOff /> : <ShieldCheck />} {admin ? "Remove admin role" : "Make admin"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => run(() => revokeUserSessions(u.id), "Sessions revoked.")}>
                    <LogOut /> Sign out everywhere
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => open("password", u)}>
                    <KeyRound /> Set password…
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" disabled={self} onClick={() => open("delete", u)}>
                    <Trash2 /> Delete user…
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          );
        })}
      </ul>

      {/* Ban */}
      <Dialog open={dialog?.kind === "ban"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban {dialog?.user.email}</DialogTitle>
            <DialogDescription>The user is signed out immediately and sees the reason when trying to log in.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ban-reason">Reason</Label>
              <Input id="ban-reason" value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Abusive behaviour in the Arena" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ban-duration">Duration</Label>
              <Select items={DURATIONS} value={duration} onValueChange={(v) => setDuration(v ?? "7")}>
                <SelectTrigger id="ban-duration" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATIONS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <TransferError>{error}</TransferError>
          </div>
          <DialogFooter>
            <ChunkyButton type="button" tone="outline-primary" disabled={pending} onClick={() => setDialog(null)}>
              Cancel
            </ChunkyButton>
            <ChunkyButton
              type="button"
              tone="danger"
              disabled={pending || !reason.trim()}
              onClick={() => dialog && run(() => banUser(dialog.user.id, reason, duration === "permanent" ? null : Number(duration)), "User banned.", true)}
            >
              <Ban /> {pending ? "Banning…" : "Ban"}
            </ChunkyButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hasło */}
      <Dialog open={dialog?.kind === "password"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set password for {dialog?.user.email}</DialogTitle>
            <DialogDescription>Minimum 8 characters. Existing sessions of this user stay active unless you sign them out.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Label htmlFor="new-password">New password</Label>
            <Input id="new-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <TransferError>{error}</TransferError>
          </div>
          <DialogFooter>
            <ChunkyButton type="button" tone="outline-primary" disabled={pending} onClick={() => setDialog(null)}>
              Cancel
            </ChunkyButton>
            <ChunkyButton
              type="button"
              tone="success"
              disabled={pending || password.length < 8}
              onClick={() => dialog && run(() => setUserPassword(dialog.user.id, password), "Password changed.", true)}
            >
              {pending ? "Saving…" : "Save"}
            </ChunkyButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Usuwanie */}
      <Dialog open={dialog?.kind === "delete"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {dialog?.user.email}?</DialogTitle>
            <DialogDescription>The account, its progress and Arena history will be permanently removed. This cannot be undone.</DialogDescription>
          </DialogHeader>
          <TransferError>{error}</TransferError>
          <DialogFooter>
            <ChunkyButton type="button" tone="outline-primary" disabled={pending} onClick={() => setDialog(null)}>
              Cancel
            </ChunkyButton>
            <ChunkyButton type="button" tone="danger" disabled={pending} onClick={() => dialog && run(() => removeUser(dialog.user.id), "User deleted.", true)}>
              <Trash2 /> {pending ? "Deleting…" : "Delete"}
            </ChunkyButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
