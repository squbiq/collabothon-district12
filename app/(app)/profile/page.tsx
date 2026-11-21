"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Flame, Mail, Star, User as UserIcon, CalendarDays, RefreshCw, Save, ShieldCheck, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import { authClient } from "@/lib/auth-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ChunkyButton } from "@/components/shared/chunky-button";
import { toast } from "@/components/ui/toast";
import { downloadJson } from "@/components/shared/transfer-ui";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { exportMyData } from "@/lib/profile/actions";

const formatDate = (date: Date | string) =>
  new Date(date).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" });

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border-2 p-4">
      <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-2xl font-bold">{value}</span>
      </div>
    </div>
  );
}

function ReadOnlyRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export default function Profile() {
  const { data: session, isPending, refetch } = authClient.useSession();
  const user = session?.user as
    | (NonNullable<typeof session>["user"] & {
      username?: string | null;
      role?: string | null;
      experience?: number;
      streak?: number;
    })
    | undefined;

  // Wersje robocze pól: null = użytkownik jeszcze nic nie zmieniał, pokazujemy dane z sesji.
  // Dzięki temu nie trzeba kopiować sesji do stanu w efekcie.
  const [usernameDraft, setUsernameDraft] = useState<string | null>(null);
  const [emailDraft, setEmailDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const username = usernameDraft ?? user?.username ?? "";
  const email = emailDraft ?? user?.email ?? "";

  if (isPending) {
    return (
      <div className="w-full">
        <section className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </section>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="w-full">
        <p className="p-6 text-center">You have to be logged in to see your profile.</p>
      </div>
    );
  }

  const usernameChanged = username.trim() !== (user.username ?? "");
  const emailChanged = email.trim() !== user.email;
  const hasChanges = usernameChanged || emailChanged;
  const isAdmin = user.role?.split(",").map((r) => r.trim()).includes("admin") ?? false;

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges) return;

    setSaving(true);
    try {
      if (usernameChanged) {
        const { error } = await authClient.updateUser({ username: username.trim() });
        if (error) {
          toast.add({ type: "error",
            title: error.message ?? "Username could not be changed."
          });
          return;
        }
      }

      if (emailChanged) {
        const { error } = await authClient.changeEmail({ newEmail: email.trim() });
        if (error) {
          toast.add({ type: "error",
            title: error.message ?? "E-mail could not be changed."
          });
          return;
        }
      }

      toast.add({ type: "success",
        title: "Profile has been updated"
      });
      await refetch();
      // po zapisie znów pokazujemy dane z sesji
      setUsernameDraft(null);
      setEmailDraft(null);
    } finally {
      setSaving(false);
    }
  };

  const onExport = async () => {
    setExporting(true);
    try {
      const result = await exportMyData();
      if (!result.ok) {
        toast.add({ type: "error", title: result.error });
        return;
      }
      downloadJson(result.filename, result.json);
      toast.add({ type: "success", title: "Your data has been exported" });
    } finally {
      setExporting(false);
    }
  };

  const onDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleting(true);
    setDeleteError(null);
    try {
      const { error } = await authClient.deleteUser({ password: deletePassword });
      if (error) {
        setDeleteError(error.message ?? "The account could not be deleted.");
        return;
      }
      toast.add({ type: "success", title: "Your account has been deleted" });
      setDeleteOpen(false);
      router.push("/login");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="w-full">
      <section className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
        {/* Statystyki */}
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard icon={<Star className="size-6" />} label="Experience" value={`${user.experience ?? 0} XP`} />
          <StatCard icon={<Flame className="size-6" />} label="Streak" value={`${user.streak ?? 0} dni`} />
        </div>

        {/* Edycja danych */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-2xl">Your profile</CardTitle>
              {isAdmin && (
                <Badge className="gap-1.5 px-3 py-1 text-sm">
                  <ShieldCheck className="size-4" /> Admin
                </Badge>
              )}
            </div>
            <CardDescription>Update your account details.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSave} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="username" className="flex items-center gap-2">
                  <UserIcon className="size-4" /> Username
                </Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsernameDraft(e.target.value)}
                  minLength={3}
                  maxLength={30}
                  required
                  className="h-12"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="size-4" /> E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmailDraft(e.target.value)}
                  required
                  className="h-12"
                />
              </div>

              <ChunkyButton
                type="submit"
                tone="outline-primary"
                size="lg"
                disabled={!hasChanges || saving}
                className="h-14 justify-center gap-4"
              >
                <Save className="size-5" /> {saving ? "Saving..." : "Save changes."}
              </ChunkyButton>
            </form>

            <Separator className="my-6" />

            {/* Dane tylko do odczytu */}
            <div className="flex flex-col gap-3">
              <ReadOnlyRow icon={<CalendarDays className="size-4" />} label="Account created" value={formatDate(user.createdAt)} />
              <ReadOnlyRow icon={<RefreshCw className="size-4" />} label="Last update" value={formatDate(user.updatedAt)} />
            </div>
          </CardContent>
        </Card>

        {/* Eksport danych */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-2xl">Your data</CardTitle>
            <CardDescription>Download your account data, progress and Arena history as a JSON file. Passwords and sessions are not included.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChunkyButton type="button" tone="outline-primary" disabled={exporting} onClick={onExport}>
              <Download /> {exporting ? "Exporting..." : "Export my data (.json)"}
            </ChunkyButton>
          </CardContent>
        </Card>

        {/* Usuwanie konta – tylko dla użytkowników bez roli admina */}
        <Card className="border-2 border-destructive/40">
          <CardHeader>
            <CardTitle className="text-2xl">Delete account</CardTitle>
            <CardDescription>
              {isAdmin
                ? "Administrator accounts cannot be deleted."
                : "Permanently removes your account, progress and Arena history. This cannot be undone."}
            </CardDescription>
          </CardHeader>
          {!isAdmin && (
            <CardContent>
              <ChunkyButton
                type="button"
                tone="outline-danger"
                onClick={() => {
                  setDeletePassword("");
                  setDeleteError(null);
                  setDeleteOpen(true);
                }}
              >
                <Trash2 /> Delete my account
              </ChunkyButton>
            </CardContent>
          )}
        </Card>
      </section>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <form onSubmit={onDelete} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>Delete your account?</DialogTitle>
              <DialogDescription>Enter your password to confirm. All your data will be permanently deleted.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <Label htmlFor="delete-password">Password</Label>
              <Input
                id="delete-password"
                type="password"
                autoComplete="current-password"
                required
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="h-12"
              />
              {deleteError && (
                <p role="alert" className="text-sm font-medium text-destructive">
                  {deleteError}
                </p>
              )}
            </div>
            <DialogFooter>
              <ChunkyButton type="button" tone="outline-primary" disabled={deleting} onClick={() => setDeleteOpen(false)}>
                Cancel
              </ChunkyButton>
              <ChunkyButton type="submit" tone="danger" disabled={deleting || !deletePassword}>
                <Trash2 /> {deleting ? "Deleting..." : "Delete"}
              </ChunkyButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}