// app/(app)/rankings/page.tsx
//
// Rankingi: topka według liczby ukończonych lekcji, aktualnego streaka, total xp.
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { getRankings } from "@/lib/rankings";
import { RankingTabs } from "./ranking-tabs";
import { headers } from "next/headers";
import { connection } from "next/server";

export default async function RankingsPage() {
  await connection();
  const session = await auth.api.getSession({ headers: await headers() });
  const rankings = await getRankings(session?.user.id);
  return (
    <section className="flex min-h-full w-full justify-center px-4 py-6">
      <div className="flex w-full max-w-xl flex-col gap-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold">Rankings</h1>
          <p className="font-medium text-muted-foreground">
            Check your current position!
          </p>
        </header>
          <RankingTabs rankings={rankings} />
      </div>
    </section>
  );
}