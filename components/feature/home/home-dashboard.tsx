// Strona główna: powód, żeby wrócić jutro – seria, dzisiejsza misja, następna lekcja i lekcja o czasie.
import Link from "next/link";
import { ArrowRight, BookOpen, CalendarCheck, CheckCircle2, Flame, Sparkles, Star, Trophy } from "lucide-react";
import { chunkyButtonVariants } from "@/components/shared/chunky-button";
import { cn } from "@/lib/utils";
import type { getHomeData } from "@/lib/home";
import { NextMissionCountdown } from "./next-mission-countdown";
import { TimeInTheMarket } from "./time-in-the-market";

type Data = Awaited<ReturnType<typeof getHomeData>>;

const card = "flex flex-col gap-3 rounded-2xl border-2 border-b-4 p-5";

export function HomeDashboard({ data }: { data: Data }) {
  const { user } = data;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 md:px-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-foreground">{user ? `Welcome back, ${user.name}` : "Grow money, one day at a time"}</h1>
        <p className="font-medium text-muted-foreground">
          {user
            ? user.doneToday
              ? "Today is done. Come back tomorrow – investing rewards patience."
              : user.streak > 0
                ? `Your ${user.streak}-day streak is waiting. One minute keeps it alive.`
                : "Start a streak today: one minute a day is all it takes."
            : "Investing is not a sprint. A minute a day builds the habit – and the knowledge – that money grows with."}
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {user ? <StreakCard user={user} /> : <GuestCard />}
        <MissionCard data={data} loggedIn={Boolean(user)} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <NextLessonCard data={data} loggedIn={Boolean(user)} />
        <TimeInTheMarket />
      </div>
    </div>
  );
}

function StreakCard({ user }: { user: NonNullable<Data["user"]> }) {
  return (
    <section aria-label="Your streak" className={cn(card, "justify-between")}>
      <div className="flex flex-wrap items-center gap-4">
        <div className={cn("flex size-16 items-center justify-center rounded-2xl", user.streak > 0 ? "bg-orange-100 text-orange-500 dark:bg-orange-950" : "bg-muted text-muted-foreground")}>
          <Flame className="size-9" />
        </div>
        <div>
          <p className="text-4xl font-extrabold text-foreground tabular-nums">{user.streak}</p>
          <p className="font-bold text-muted-foreground">day streak</p>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2 font-extrabold text-amber-600 dark:text-amber-400">
          <Star className="size-5" /> <span className="tabular-nums">{user.xp.toLocaleString("en-US")}</span> XP
        </div>
      </div>

      <ol className="grid grid-cols-7 gap-2" aria-label="Last 7 days">
        {user.week.map((d, i) => (
          <li key={i} className="flex flex-col items-center gap-1">
            <span
              className={cn(
                "flex size-9 items-center justify-center rounded-full border-2 text-sm font-extrabold",
                d.active ? "border-orange-500 bg-orange-500 text-white" : "border-border text-muted-foreground",
                d.today && !d.active && "border-dashed border-orange-400"
              )}
            >
              {d.active ? <CheckCircle2 className="size-5" /> : d.label}
            </span>
            <span className="text-xs font-semibold text-muted-foreground">{d.today ? "today" : d.label}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function GuestCard() {
  return (
    <section className={card}>
      <Sparkles className="size-8 text-primary" />
      <h2 className="text-xl font-extrabold">Build a daily habit</h2>
      <p className="font-medium text-muted-foreground">
        Short lessons, a daily mission and a streak that rewards showing up. Create an account to save your progress.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href="/register" className={chunkyButtonVariants({ tone: "success" })}>
          Create account
        </Link>
        <Link href="/login" className={chunkyButtonVariants({ tone: "outline-primary" })}>
          Sign in
        </Link>
      </div>
    </section>
  );
}

function MissionCard({ data, loggedIn }: { data: Data; loggedIn: boolean }) {
  const { lesson, completed } = data.mission;

  return (
    <section aria-label="Daily mission" className={cn(card, "justify-between", completed && "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950/40")}>
      <div className="flex items-center gap-2 text-sm font-extrabold tracking-wide text-primary uppercase">
        <CalendarCheck className="size-4" /> Daily mission
      </div>

      {lesson ? (
        <>
          <div>
            <h2 className="text-xl font-extrabold text-foreground">{lesson.title}</h2>
            <p className="font-medium text-muted-foreground">
              {lesson.category} · +{lesson.rewardExp} XP + streak
            </p>
          </div>
          {completed ? (
            <p className="flex items-center gap-2 font-extrabold text-green-700 dark:text-green-300">
              <CheckCircle2 className="size-5" /> Completed – next mission in <NextMissionCountdown />
            </p>
          ) : (
            <Link href="/daily-lesson" className={chunkyButtonVariants({ tone: "success", size: "lg" })}>
              {loggedIn ? "Start the 1-minute mission" : "Try today's mission"} <ArrowRight />
            </Link>
          )}
        </>
      ) : (
        <p className="font-medium text-muted-foreground">No mission today yet. New one in <NextMissionCountdown />.</p>
      )}
    </section>
  );
}

function NextLessonCard({ data, loggedIn }: { data: Data; loggedIn: boolean }) {
  const { nextLesson, completedLessons, totalLessons } = data;
  const pct = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <section aria-label="Continue learning" className={cn(card, "justify-between")}>
      <div className="flex items-center gap-2 text-sm font-extrabold tracking-wide text-primary uppercase">
        <BookOpen className="size-4" /> Continue learning
      </div>

      {loggedIn && nextLesson ? (
        <div>
          <h2 className="text-xl font-extrabold text-foreground">{nextLesson.title}</h2>
          <p className="font-medium text-muted-foreground">
            {nextLesson.chapterTitle} · ~{nextLesson.estimatedMinutes} min
          </p>
        </div>
      ) : (
        <p className="font-medium text-muted-foreground">
          {loggedIn ? "You finished every lesson available. New ones are coming." : "Sign in to track which lesson comes next."}
        </p>
      )}

      {loggedIn && totalLessons > 0 && (
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-sm font-bold">
            <span>Lessons completed</span>
            <span className="tabular-nums">
              {completedLessons} / {totalLessons}
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Link href={loggedIn && nextLesson ? `/lesson-map/${nextLesson.id}` : "/lesson-map"} className={chunkyButtonVariants({ tone: "primary" })}>
          {loggedIn && nextLesson ? "Continue" : "Browse lessons"} <ArrowRight />
        </Link>
        <Link href="/rankings" className={chunkyButtonVariants({ tone: "outline-primary" })}>
          <Trophy /> Rankings
        </Link>
      </div>
    </section>
  );
}
