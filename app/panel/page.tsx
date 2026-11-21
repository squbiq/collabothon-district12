// app/panel/page.tsx
//
// Wybór sekcji panelu: lekcje albo zadania dzienne.
import Link from "next/link";
import { CalendarCheck, GraduationCap } from "lucide-react";

const SECTIONS = [
  {
    href: "/panel/lesson",
    title: "Lessons",
    description: "Topics, chapters, lessons and their stages. Import and export lessons as JSON.",
    icon: GraduationCap,
  },
  {
    href: "/panel/daily-lesson",
    title: "Daily lessons",
    description: "Pool of daily multiple-choice tasks shared by all users.",
    icon: CalendarCheck,
  },
];

export default function PanelPage() {
  return (
    <div className="flex w-full max-w-3xl flex-col gap-6 px-4 pb-10 sm:px-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-foreground">Admin panel</h1>
        <p className="font-medium text-muted-foreground">Choose what you want to manage.</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map(({ href, title, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col gap-3 rounded-2xl border-2 border-b-[6px] p-5 transition-colors hover:bg-muted focus-visible:ring-4 focus-visible:ring-ring/40 outline-none"
          >
            <Icon className="size-8 text-primary" />
            <span className="text-xl font-extrabold text-foreground">{title}</span>
            <span className="text-sm font-medium text-muted-foreground">{description}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
