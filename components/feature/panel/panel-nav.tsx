// Nawigacja panelu admina: powrót na stronę główną, wybór sekcji (lekcje / zadania dzienne).
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, GraduationCap, Home, LayoutDashboard } from "lucide-react";
import { cn } from "cn";

const LINKS = [
  { href: "/panel", label: "Panel", icon: LayoutDashboard, exact: true },
  { href: "/panel/lesson", label: "Lessons", icon: GraduationCap, exact: false },
  { href: "/panel/daily-lesson", label: "Daily lessons", icon: CalendarCheck, exact: false },
];

export function PanelNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin panel" className="flex w-full flex-wrap items-center gap-1 border-b px-8 pb-3">
      <Link
        href="/"
        className="mr-2 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Home className="size-4" /> Home
      </Link>
      <span aria-hidden className="mr-2 h-5 w-px bg-border" />
      {LINKS.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition-colors",
              active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4" /> {label}
          </Link>
        );
      })}
    </nav>
  );
}
