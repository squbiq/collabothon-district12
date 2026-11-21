import { Suspense } from 'react';
import { getSession } from '@/lib/session';
import { getDailyLessonsData } from '@/lib/daily/queries';
import { DailyLessonView } from '@/components/daily-lesson-view';

async function DailyLessonContent() {
  // sesja czyta nagłówki żądania, więc dalszy kod (w tym zegar) działa już w trybie dynamicznym
  const session = await getSession();
  const data = await getDailyLessonsData(session?.user.id);

  return (
    <DailyLessonView
      isLoggedIn={Boolean(session)}
      todayKey={data.today}
      initialLessons={data.lessonsByDate}
      initialCompletedDates={data.completedDates}
      initialAnswers={data.answersByDate}
      initialStreak={data.streak}
    />
  );
}

export default function DailyLessonPage() {
  return (
    <section className="w-full min-h-full flex justify-center items-start">
      <Suspense fallback={<p className="py-20 font-bold text-muted-foreground">Loading daily lesson…</p>}>
        <DailyLessonContent />
      </Suspense>
    </section>
  );
}
