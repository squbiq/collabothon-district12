// app/(app)/rankings/page.tsx
//
// Rankingi: topka według liczby ukończonych lekcji, aktualnego streaka, total xp.
import { Suspense } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getRankings } from "@/lib/rankings";
import { RankingTabs } from "./ranking-tabs";

// Sesja i baza zależą od żądania, więc czytamy je za <Suspense> (cacheComponents).
async function RankingsContent() {
  const session = await auth.api.getSession({ headers: await headers() });
  const rankings = await getRankings(session?.user.id);
  return <RankingTabs rankings={rankings} />;
}

export default function RankingsPage() {
  return (
    <section className="flex min-h-full w-full justify-center px-4 py-6">
      <div className="flex w-full max-w-xl flex-col gap-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold">Rankings</h1>
          <p className="font-medium text-muted-foreground">Check your current position!</p>
        </header>
        <Suspense fallback={<p className="font-bold text-muted-foreground">Loading rankings…</p>}>
          <RankingsContent />
        </Suspense>
      </div>
    </section>
  );
}
