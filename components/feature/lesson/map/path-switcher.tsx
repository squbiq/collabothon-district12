// Nagłówek mapy lekcji + przełącznik tematów (ścieżek nauki) pobranych z tabeli Topic.
import Link from "next/link";
import { chunkyButtonVariants } from "@/components/shared/chunky-button";
import { cn } from "@/lib/utils";
import type { TopicOption } from "@/lib/lesson/topics";

export function PathSwitcher({ topics, currentId }: { topics: TopicOption[]; currentId: string }) {
  const current = topics.find((t) => t.id === currentId);

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-3xl font-extrabold text-foreground">{current?.title ?? "Lessons"}</h1>

      <nav aria-label="Change path" className="grid grid-cols-2 gap-2">
        {topics.map((topic) => {
          const isCurrent = topic.id === currentId;
          return (
            <Link
              key={topic.id}
              href={`/lesson-map?path=${topic.id}`}
              aria-current={isCurrent ? "page" : undefined}
              className={cn(
                chunkyButtonVariants({ tone: isCurrent ? "primary" : "outline-primary" }),
                "h-auto py-2 text-center whitespace-normal"
              )}
            >
              {topic.title}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
