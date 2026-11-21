"use client"

import Image from "next/image";
import Link from "next/link";
import logo from "@/public/logo-all.svg"
import { cn } from "cn";
import {
  BookOpen,
  CalendarDays,
  Home,
  LogIn,
  LogOut,
  LucideIcon,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  Trophy,
  User as UserIcon,
} from "lucide-react";
import { ChunkyButton, chunkyButtonVariants } from "@/components/shared/chunky-button";
import { ChubbyTooltip } from "@/components/shared/chubby-tooltip";
import { Suspense, ViewTransition, useState } from "react";
import { type User, useUser } from "@/components/context/user-context";
import { VariantProps } from "class-variance-authority";
import { authClient } from "@/lib/auth-client";
import { usePathname } from "next/navigation";

type Tone = VariantProps<typeof chunkyButtonVariants>["tone"];

// Wszystkie pozycje menu mają ten sam układ: ikona + etykieta. Po zwinięciu zostaje sama ikona (przycisk ma 56 px).
const itemStyle = (tone: Tone = "primary") =>
  cn(chunkyButtonVariants({ size: "lg", tone }), "h-14 justify-start gap-4 p-4.5!");

const navLinks: { href: string; title: string; icon: LucideIcon }[] = [
  { href: "/", title: "Home", icon: Home },
  { href: "/daily-lesson", title: "Daily lesson", icon: CalendarDays },
  { href: "/lesson-map", title: "Lessons", icon: BookOpen },
  //{ href: "/arena", title: "Arena", icon: Swords },
  { href: "/rankings", title: "Rankings", icon: Trophy },
];

const isActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

export default function AppLayout({ children }: LayoutProps<"/">) {
  const [open, setOpen] = useState<boolean>(true);
  const { user } = useUser();
  const collapsed = !open;

  return (
    <section className="w-dvw h-dvh flex flex-row">
      {/* Nawigacja nie animuje się przy zmianie strony (default="none"); chowa się w lewo tylko przy wejściu do /panel. */}
      <ViewTransition name="app-nav" enter={{ "to-app": "app-nav-in", default: "none" }} exit={{ "to-panel": "app-nav-out", default: "none" }} default="none">
      <nav
        aria-label="Main"
        className={cn(
          "h-full shrink-0 flex flex-col justify-start items-stretch gap-4 overflow-x-hidden overflow-y-auto border-r box-border px-3.5 py-4",
          "transition-[width] duration-200 ease-out motion-reduce:transition-none",
          open ? "w-72" : "w-22"
        )}
      >
        <section className={cn("h-14 shrink-0 flex flex-row items-center gap-2", open ? "justify-between pl-1" : "justify-center")}>
          {open && <Image src={logo} alt="Finanz.io" priority className="h-auto w-36 min-w-0" />}
          <ChubbyTooltip label={open ? "Collapse menu" : "Expand menu"} side="right" disabled={open}>
            <ChunkyButton
              tone="outline-primary"
              className="size-14 shrink-0"
              aria-label={open ? "Collapse menu" : "Expand menu"}
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              {open ? <PanelLeftClose /> : <PanelLeftOpen />}
            </ChunkyButton>
          </ChubbyTooltip>
        </section>

        <section className="flex min-h-0 flex-1 flex-col items-stretch justify-between gap-4">
          <section className="w-full flex flex-col box-border gap-4">
            {/* usePathname() jest danymi z requestu, więc musi być w Suspense (cacheComponents). */}
            <Suspense fallback={<NavLinks selected="" collapsed={collapsed} />}>
              <ActiveNavLinks collapsed={collapsed} />
            </Suspense>
          </section>
          <AppNavFooter user={user} collapsed={collapsed} />
        </section>
      </nav>
      </ViewTransition>

      <main className="relative! w-full min-h-dvh flex box-border overflow-x-hidden!">
        {children}
      </main>
    </section>
  );
}

// Linki nawigacji z podświetleniem aktywnej trasy (wyliczanym z adresu, bez stanu i efektu).
function ActiveNavLinks({ collapsed }: { collapsed: boolean }) {
  const pathName = usePathname();
  return <NavLinks selected={navLinks.find((l) => isActive(pathName, l.href))?.href ?? ""} collapsed={collapsed} />;
}

function NavLinks({ selected, collapsed }: { selected: string; collapsed: boolean }) {
  return navLinks.map(({ href, title, icon }) => (
    <NavItem key={href} href={href} label={title} icon={icon} collapsed={collapsed} tone={selected === href ? "primary" : "outline-none"} />
  ));
}

// Jedna pozycja menu; po zwinięciu etykieta znika, a chubby-tooltip mówi, dokąd prowadzi przycisk.
function NavItem({ href, label, icon: Icon, collapsed, tone }: { href: string; label: string; icon: LucideIcon; collapsed: boolean; tone: Tone }) {
  return (
    <ChubbyTooltip label={label} disabled={!collapsed}>
      <Link href={href} transitionTypes={href === "/panel" ? ["to-panel"] : undefined} aria-label={collapsed ? label : undefined} className={itemStyle(tone)}>
        <ItemContent icon={Icon} label={label} collapsed={collapsed} />
      </Link>
    </ChubbyTooltip>
  );
}

function ItemContent({ icon: Icon, label, collapsed }: { icon: LucideIcon; label: string; collapsed: boolean }) {
  return (
    <>
      <Icon className="size-5" />
      <span className={cn("overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ease-out", collapsed ? "max-w-0 opacity-0" : "max-w-48 opacity-100")}>
        {label}
      </span>
    </>
  );
}

function AppNavFooter({ user, collapsed }: { user: User | null; collapsed: boolean }) {
  const onSignOff = async () => {
    await authClient.signOut();
  };
  const isAdmin = (user as { role?: string | null } | null)?.role === "admin";

  return (
    <section className="w-full flex flex-col justify-center gap-4">
      {user != null ? (
        <>
          {isAdmin && <NavItem href="/panel" label="Admin panel" icon={ShieldCheck} collapsed={collapsed} tone="outline-primary" />}
          <NavItem href="/profile" label="Profile" icon={UserIcon} collapsed={collapsed} tone="outline-primary" />
          <ChubbyTooltip label="Sign off" disabled={!collapsed}>
            <ChunkyButton onClick={onSignOff} tone="outline-danger" size="lg" aria-label={collapsed ? "Sign off" : undefined} className="h-14 justify-start gap-4 p-4.5!">
              <ItemContent icon={LogOut} label="Sign Off" collapsed={collapsed} />
            </ChunkyButton>
          </ChubbyTooltip>
        </>
      ) : (
        <NavItem href="/login" label="Sign In" icon={LogIn} collapsed={collapsed} tone="outline-primary" />
      )}
    </section>
  );
}
