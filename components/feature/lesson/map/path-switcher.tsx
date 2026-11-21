// Nagłówek mapy lekcji + przełącznik ścieżek nauki.
import Link from "next/link";
import { chunkyButtonVariants } from "@/components/shared/chunky-button";
import { cn } from "@/lib/utils";
import { LESSON_PATHS, resolvePath, type LessonPathId } from "@/lib/lesson/paths";

export function PathSwitcher({ currentId }: { currentId: LessonPathId }) {
  const current = resolvePath(currentId);

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-3xl font-extrabold text-foreground">{current.name}</h1>

      <nav aria-label="Change path" className="grid grid-cols-2 gap-2">
        {LESSON_PATHS.map((path) => {
          const isCurrent = path.id === currentId;
          return (
            <Link
              key={path.id}
              href={`/lesson-map?path=${path.id}`}
              aria-current={isCurrent ? "page" : undefined}
              className={cn(
                chunkyButtonVariants({ tone: isCurrent ? "primary" : "outline-none" }),
                "h-auto py-2 text-center whitespace-normal"
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
