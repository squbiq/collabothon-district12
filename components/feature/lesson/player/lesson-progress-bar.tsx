// Górny pasek odtwarzacza: wyjście z lekcji + pasek postępu.
import Link from "next/link";

export function LessonProgressBar({ progress, title }: { progress: number; title: string }) {
  return (
    <header className="mx-auto flex w-full max-w-2xl items-center gap-4 px-4 py-4">
      <Link
        href="/lesson-map"
        aria-label="Exit lesson"
        className="text-2xl leading-none font-bold text-muted-foreground hover:text-foreground"
      >
        ✕
      </Link>
      <div
        className="h-4 flex-1 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Lesson progress: ${title}`}
      >
        <div
          className="h-full rounded-full bg-green-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </header>
  );
}
