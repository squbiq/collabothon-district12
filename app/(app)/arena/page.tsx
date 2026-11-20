// app/(app)/arena/page.tsx
//
// Arena: rywalizacja w quizach (ranking, pojedynki).
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ArenaPage() {
  return (
    <section className="flex min-h-full w-full justify-center px-4 py-6">
      <div className="flex w-full max-w-xl flex-col gap-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold">Arena</h1>
          <p className="font-medium text-muted-foreground">
            Rywalizuj w quizach i sprawdź, kto jest najlepszy
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Ranking</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            Tutaj pojawi się ranking.
          </CardContent>
        </Card>
      </div>
    </section>
  );
}