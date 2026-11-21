// app/(app)/arena/page.tsx
//
// Arena: pojedynek z botem (trzy poziomy trudności) albo gra online. Pytania pochodzą z daily lessons.
import { Suspense } from "react";
import { ArenaHub } from "@/components/feature/arena/arena-hub";
import { currentTime, utcDateKey } from "@/lib/clock";
import { getArenaRounds } from "@/lib/arena/pool";

// Liczba rund zależy od puli pytań w bazie, więc czytamy ją za <Suspense> (zegar = dane żądania).
async function ArenaContent() {
  const rounds = await getArenaRounds(utcDateKey(await currentTime()));
  return <ArenaHub rounds={rounds} />;
}

export default function ArenaPage() {
  return (
    <section className="flex min-h-full w-full justify-center px-4 py-6">
      <div className="flex w-full max-w-4xl flex-col gap-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold">Arena</h1>
          <p className="font-medium text-muted-foreground">
            Face the bot or another player and see who handles real market scenarios better
          </p>
        </header>
        <Suspense fallback={<p className="text-center font-bold text-muted-foreground">Loading arena…</p>}>
          <ArenaContent />
        </Suspense>
      </div>
    </section>
  );
}