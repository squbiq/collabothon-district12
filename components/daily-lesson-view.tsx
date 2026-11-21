'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flame,
  History,
  Sparkles,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import { addDays, formatDisplayDate, fromDateKey, toDateKey } from '@/lib/daily/date';
import { completeDaily } from '@/lib/daily/actions';
import type { DailyLessonDTO } from '@/lib/daily/queries';
import { ChunkyButton, chunkyButtonVariants } from '@/components/shared/chunky-button';
import { toast } from '@/components/ui/toast';

interface DailyLessonViewProps {
  isLoggedIn: boolean;
  /** Dzisiejszy klucz dnia z serwera – widok sam nie czyta zegara. */
  todayKey: string;
  initialLessons: Record<string, DailyLessonDTO>;
  initialCompletedDates: string[];
  initialAnswers: Record<string, string>;
  initialStreak: number;
}

export function DailyLessonView({
  isLoggedIn,
  todayKey,
  initialLessons,
  initialCompletedDates,
  initialAnswers,
  initialStreak,
}: DailyLessonViewProps) {
  const today = useMemo(() => fromDateKey(todayKey), [todayKey]);
  const lessonsByDate = initialLessons;

  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [streak, setStreak] = useState<number>(initialStreak);
  const [completedDates, setCompletedDates] = useState<string[]>(initialCompletedDates);
  const [answersByDate, setAnswersByDate] = useState<Record<string, string>>(initialAnswers);
  // Po ukończeniu można oglądać feedback innych opcji – to tylko podgląd, nic się nie zapisuje.
  const [preview, setPreview] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  const selectedKey = toDateKey(selectedDate);
  const isToday = selectedKey === todayKey;
  const currentLesson = lessonsByDate[selectedKey];
  const isAlreadyCompleted = completedDates.includes(selectedKey);
  const selectedOptionId = preview[selectedKey] ?? answersByDate[selectedKey];
  const selectedOption = currentLesson?.options.find((opt) => opt.id === selectedOptionId);

  const completedDateObjects = useMemo(
    () => completedDates.map(fromDateKey),
    [completedDates]
  );

  const availableUncompletedObjects = useMemo(
    () =>
      Object.keys(lessonsByDate)
        .filter((key) => !completedDates.includes(key))
        .map(fromDateKey),
    [lessonsByDate, completedDates]
  );

  const handleSelectOption = (optionId: string) => {
    if (!currentLesson || pending) return;

    // Już ukończone (lub brak konta): tylko podgląd feedbacku.
    if (isAlreadyCompleted || !isLoggedIn) {
      setPreview((prev) => ({ ...prev, [selectedKey]: optionId }));
      if (!isLoggedIn) toast.add({ title: 'Sign in to save your progress and earn XP', type: 'info' });
      return;
    }

    const lessonKey = selectedKey;
    startTransition(async () => {
      const result = await completeDaily(currentLesson.id, optionId);
      if (!result.ok) {
        toast.add({ title: result.error, type: 'error' });
        return;
      }

      // Zadanie oznaczone jako ukończone dopiero po potwierdzeniu przez serwer
      setCompletedDates((prev) => (prev.includes(lessonKey) ? prev : [...prev, lessonKey]));
      setAnswersByDate((prev) => ({ ...prev, [lessonKey]: optionId }));
      setPreview((prev) => ({ ...prev, [lessonKey]: optionId }));
      setStreak(result.streak);
      if (result.firstCompletion) {
        toast.add({
          title: `Completed! +${result.xpGained} XP`,
          description: lessonKey === todayKey ? `Streak: ${result.streak} day${result.streak === 1 ? '' : 's'}` : 'Archive task – streak unchanged',
          type: 'success',
        });
      }
    });
  };

  const handleShiftDay = (offset: number) => {
    const nextDate = addDays(selectedDate, offset);
    if (nextDate > today) return;
    setSelectedDate(nextDate);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8 space-y-6">
      {/* Header: Title, Streak, and Quick Date Navigation */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Daily Lesson</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            1 minute a day for a real-world market scenario. Use the calendar to revisit past dates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary" className="px-3 py-1.5 text-sm gap-1.5">
            <Flame className="h-4 w-4 text-orange-500" />
            <span>Streak: {streak} days</span>
          </Badge>

          <div className="flex items-center gap-1 rounded-lg border bg-card p-1">
            <ChunkyButton tone="outline-none" size="sm" className="aspect-square px-0"
              onClick={() => handleShiftDay(-1)}
              aria-label="Previous day"
            >
              <ChevronLeft className="h-4 w-4" />
            </ChunkyButton>

            <span className="px-2 text-sm font-medium min-w-32.5 text-center">
              {isToday ? 'Today' : formatDisplayDate(selectedDate)}
            </span>

            <ChunkyButton tone="outline-none" size="sm" className="aspect-square px-0"
              onClick={() => handleShiftDay(1)}
              disabled={isToday}
              aria-label="Next day"
            >
              <ChevronRight className="h-4 w-4" />
            </ChunkyButton>
          </div>
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Daily Question Card */}
        <div className="lg:col-span-8">
          {currentLesson ? (
            <Card className="shadow-sm">
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {isToday ? (
                      <Badge className="gap-1">
                        <Sparkles className="h-3.5 w-3.5" />
                        Today&apos;s Challenge
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <History className="h-3.5 w-3.5" />
                        Archive • {formatDisplayDate(selectedDate)}
                      </Badge>
                    )}
                    <Badge variant="secondary">{currentLesson.category}</Badge>
                  </div>

                  {isAlreadyCompleted ? (
                    <Badge
                      variant="outline"
                      className="border-emerald-500/50 text-emerald-600 dark:text-emerald-400 gap-1"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Completed
                    </Badge>
                  ) : (
                    <span className="text-xs font-medium text-muted-foreground">
                      {isToday
                        ? `+${currentLesson.rewardExp} XP + Streak`
                        : 'Archive mode (no streak change)'}
                    </span>
                  )}
                </div>

                <CardTitle className="text-xl md:text-2xl">{currentLesson.title}</CardTitle>
                <CardDescription className="text-base text-foreground/90 leading-relaxed pt-1">
                  {currentLesson.scenario}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="grid gap-3">
                  {currentLesson.options.map((option) => {
                    const isSelected = selectedOptionId === option.id;
                    let stateClasses = 'hover:border-primary/60 hover:bg-accent/50';

                    if (isSelected) {
                      stateClasses = option.isOptimal
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-amber-500 bg-amber-500/10';
                    }

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => handleSelectOption(option.id)}
                        className={`w-full text-left rounded-xl border p-4 transition-all cursor-pointer ${stateClasses}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className="font-medium text-sm md:text-base">{option.label}</span>
                          {isSelected &&
                            (option.isOptimal ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                            ) : (
                              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                            ))}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Feedback Alert */}
                {selectedOption && (
                  <Alert
                    className={`mt-4 ${
                      selectedOption.isOptimal
                        ? 'border-emerald-500/50 bg-emerald-500/10'
                        : 'border-amber-500/50 bg-amber-500/10'
                    }`}
                  >
                    {selectedOption.isOptimal ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    )}
                    <AlertTitle>
                      {selectedOption.isOptimal ? 'Smart Decision!' : 'Worth Reconsidering'}
                    </AlertTitle>
                    <AlertDescription className="mt-1">
                      {selectedOption.feedback}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>

              <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                {!isToday ? (
                  <ChunkyButton tone="outline-primary" size="sm" onClick={() => setSelectedDate(today)}>
                    Back to Today&apos;s Lesson
                  </ChunkyButton>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Feel free to explore different answers — learn with zero penalties.
                  </span>
                )}

                {selectedOption && (
                  <Link href="/lesson-map" className={chunkyButtonVariants({ tone: 'primary', size: 'sm' })}>
                    Keep learning
                    <ArrowRight />
                  </Link>
                )}
              </CardFooter>
            </Card>
          ) : (
            /* Empty State for Dates Without a Lesson */
            <Card className="shadow-sm">
              <CardContent className="flex flex-col items-center justify-center text-center py-16 space-y-4">
                <CalendarDays className="h-12 w-12 text-muted-foreground/60" />
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold">
                    No lesson available for {formatDisplayDate(selectedDate)}
                  </h2>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Pick one of the highlighted past dates in the calendar or jump back to today&apos;s challenge.
                  </p>
                </div>
                <ChunkyButton tone="primary" onClick={() => setSelectedDate(today)}>
                  Back to Today&apos;s Lesson
                </ChunkyButton>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Archive Calendar */}
        <Card className="lg:col-span-4 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Lesson Archive
            </CardTitle>
            <CardDescription className="text-xs">
              Select any past date to revisit previous questions.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col items-center space-y-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              disabled={{ after: today }}
              modifiers={{
                completed: completedDateObjects,
                available: availableUncompletedObjects,
              }}
              modifiersClassNames={{
                completed:
                  'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold rounded-md',
                available:
                  'ring-1 ring-primary/60 font-medium rounded-md',
              }}
              className="rounded-md border"
            />

            {/* Calendar Legend */}
            <div className="w-full flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground pt-1">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full border border-primary" />
                <span>Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                <span>Selected</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}