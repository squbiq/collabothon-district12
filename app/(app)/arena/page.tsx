// app/(app)/arena/page.tsx
//
// Arena: pojedynek z botem na pytania z daily lessons.
import { ArenaDuel } from "@/components/feature/lesson/arena/arena-duel";

export default function ArenaPage() {
  return (
    <section className="flex min-h-full w-full justify-center px-4 py-6">
      <div className="flex w-full max-w-4xl flex-col gap-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold">Arena</h1>
          <p className="font-medium text-muted-foreground">
            Face the bot and see who handles real market scenarios better
          </p>
        </header>
        <ArenaDuel />
      </div>
    </section>
  );
}