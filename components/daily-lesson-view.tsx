'use client';

import { useMemo, useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import {
  addDays,
  formatDisplayDate,
  fromDateKey,
  getMockDailyLessons,
  toDateKey,
} from '@/lib/daily/mock-data';

export function DailyLessonView() {
  const today = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }, []);

  const todayKey = useMemo(() => toDateKey(today), [today]);
  const lessonsByDate = useMemo(() => getMockDailyLessons(today), [today]);

  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [streak, setStreak] = useState<number>(2);

  // Pre-marked past days so the calendar looks active during the demo
  const [completedDates, setCompletedDates] = useState<string[]>(() => [
    toDateKey(addDays(today, -1)),
    toDateKey(addDays(today, -2)),
  ]);

  // Remember selected answers per date
  const [answersByDate, setAnswersByDate] = useState<Record<string, string>>({});

  const selectedKey = toDateKey(selectedDate);
  const isToday = selectedKey === todayKey;
  const currentLesson = lessonsByDate[selectedKey];
  const selectedOptionId = answersByDate[selectedKey];
  const selectedOption = currentLesson?.options.find((opt) => opt.id === selectedOptionId);
  const isAlreadyCompleted = completedDates.includes(selectedKey);

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
    if (!currentLesson) return;

    setAnswersByDate((prev) => ({ ...prev, [selectedKey]: optionId }));

    if (!completedDates.includes(selectedKey)) {
      setCompletedDates((prev) => [...prev, selectedKey]);
      if (isToday) {
        setStreak((prev) => prev + 1);
      }
    }
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
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleShiftDay(-1)}
              aria-label="Previous day"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="px-2 text-sm font-medium min-w-32.5 text-center">
              {isToday ? 'Today' : formatDisplayDate(selectedDate)}
            </span>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleShiftDay(1)}
              disabled={isToday}
              aria-label="Next day"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
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
                        ? `+€${currentLesson.rewardCoins} + Streak`
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
                  <Button variant="outline" onClick={() => setSelectedDate(today)}>
                    Back to Today&apos;s Lesson
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Feel free to explore different answers — learn with zero penalties.
                  </span>
                )}

                {selectedOption && (
                  <Link href="/arena">
                    <Button>
                        Apply This in the Arena
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
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
                <Button onClick={() => setSelectedDate(today)}>
                  Back to Today&apos;s Lesson
                </Button>
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