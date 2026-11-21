import { Suspense } from 'react';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getDailyLessonsData } from '@/lib/daily/actions';
import { DailyLessonView } from '@/components/daily-lesson-view';

async function DailyLessonContent() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const userId = session?.user?.id;
  const data = await getDailyLessonsData(userId);

  return (
    <DailyLessonView
      userId={userId}
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