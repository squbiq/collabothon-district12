import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function BackToList() {
  return (
    <Link
      href="/panel/daily-lesson"
      className="inline-flex w-fit items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" /> All daily tasks
    </Link>
  );
}
