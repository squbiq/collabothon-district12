import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LESSON_PATHS, type LessonPathId } from "@/lib/lesson/paths";

export function PathSwitcher({ currentId }: { currentId: LessonPathId }) {
  const current = LESSON_PATHS.find((p) => p.id === currentId)!;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col">
        <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Path
        </span>
        <h1 className="text-3xl font-extrabold">{current.name}</h1>
      </div>

      <nav aria-label="Change path" className="grid grid-cols-2 gap-2">
        {LESSON_PATHS.map((path) => {
          const isCurrent = path.id === currentId;
          return (
            <Link
              key={path.id}
              href={`/lesson-map?path=${path.id}`}
              aria-current={isCurrent ? "page" : undefined}
              className={cn(
                buttonVariants({ variant: isCurrent ? "default" : "outline" }),
                "h-auto rounded-2xl border-2 px-3 py-2 text-center font-bold whitespace-normal",
              )}
            >
              {path.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}