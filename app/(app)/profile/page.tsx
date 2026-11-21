"use client";

import { useState } from "react";
import { Flame, Mail, Star, User as UserIcon, CalendarDays, RefreshCw, Save, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import { authClient } from "@/lib/auth-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ChunkyButton } from "@/components/shared/chunky-button";
import { toast } from "@/components/ui/toast";

const formatDate = (date: Date | string) =>
  new Date(date).toLocaleString("pl-PL", { dateStyle: "long", timeStyle: "short" });

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
  const username = usernameDraft ?? user?.username ?? "";
  const email = emailDraft ?? user?.email ?? "";

  if (isPending) {
    return (
      <div className="h-dvh w-full overflow-y-auto">
        <section className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </section>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-dvh w-full overflow-y-auto">
        <p className="p-6 text-center">Musisz być zalogowany, aby zobaczyć profil.</p>
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
            title: error.message ?? "Nie udało się zmienić nazwy użytkownika"
          });
          return;
        }
      }

      if (emailChanged) {
        const { error } = await authClient.changeEmail({ newEmail: email.trim() });
        if (error) {
          toast.add({ type: "error",
            title: error.message ?? "Nie udało się zmienić adresu e-mail"
          });
          return;
        }
      }

      toast.add({ type: "success",
        title: "Profil został zaktualizowany"
      });
      await refetch();
      // po zapisie znów pokazujemy dane z sesji
      setUsernameDraft(null);
      setEmailDraft(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-dvh w-full overflow-y-auto">
      <section className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
        {/* Statystyki */}
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard icon={<Star className="size-6" />} label="Doświadczenie" value={`${user.experience ?? 0} XP`} />
          <StatCard icon={<Flame className="size-6" />} label="Seria" value={`${user.streak ?? 0} dni`} />
        </div>

        {/* Edycja danych */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-2xl">Twój profil</CardTitle>
              {isAdmin && (
                <Badge className="gap-1.5 px-3 py-1 text-sm">
                  <ShieldCheck className="size-4" /> Admin
                </Badge>
              )}
            </div>
            <CardDescription>Zmień swoje dane konta.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSave} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="username" className="flex items-center gap-2">
                  <UserIcon className="size-4" /> Nazwa użytkownika
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
                <Save className="size-5" /> {saving ? "Zapisywanie..." : "Zapisz zmiany"}
              </ChunkyButton>
            </form>

            <Separator className="my-6" />

            {/* Dane tylko do odczytu */}
            <div className="flex flex-col gap-3">
              <ReadOnlyRow icon={<CalendarDays className="size-4" />} label="Konto utworzone" value={formatDate(user.createdAt)} />
              <ReadOnlyRow icon={<RefreshCw className="size-4" />} label="Ostatnia aktualizacja" value={formatDate(user.updatedAt)} />
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}