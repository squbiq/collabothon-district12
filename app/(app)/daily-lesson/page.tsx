import { Suspense } from 'react';
import { DailyLessonView } from '@/components/daily-lesson-view';

export default function DailyLessonPage() {
  return (
    <section className="w-full min-h-full flex justify-center items-start">
      {/* Widok korzysta z new Date() (klient), więc musi być w Suspense – inaczej błąd przy prerenderze. */}
      <Suspense fallback={<p className="py-20 font-bold text-muted-foreground">Loading daily lesson…</p>}>
        <DailyLessonView />
      </Suspense>
    </section>
  );
}
