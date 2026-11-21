"use client"

import Image from "next/image";
import Link from "next/link";
import logo from "@/public/logo-all.svg"
import { cn } from "cn";
import { BookOpen, CalendarDays, LogIn, LogOut, LucideIcon, Menu, Swords, Trophy, User as UserIcon } from "lucide-react";
import { ChunkyButton, chunkyButtonVariants } from "@/components/shared/chunky-button";
import { Suspense, useState } from "react";
import { type User, useUser } from "@/components/context/user-context";
import { VariantProps } from "class-variance-authority";
import { authClient } from "@/lib/auth-client";
import { usePathname } from "next/navigation";

const buttonStyle = (tone: VariantProps<typeof chunkyButtonVariants>["tone"] = "primary") => {
  return cn(chunkyButtonVariants({ size: "lg", tone }), "justify-start h-14 gap-4 p-4.5!");
};

 
const navLinks: Record<string, { title: string, icon: LucideIcon }> = {
  "/daily-lesson": { title: "Daily lesson", icon: CalendarDays },
  "/lesson-map":   { title: "Lessons",      icon: BookOpen },
  //"/arena":        { title: "Arena",        icon: Swords },
   "/rankings":      { title: "Rankings",      icon: Trophy },
};


export default function AppLayout({ children }: LayoutProps<"/">) {

  const [ open, setOpen ] = useState<boolean>(true);
  const { user } = useUser();

  return (
    <section className="w-dvw h-dvh flex flex-row">

      <nav className={cn("relative *:overflow-hidden! h-full flex flex-col justify-start items-stretch",
        "py-4 px-3.5 box-border overflow-hidden! border-r", open ? "w-90" : "w-22", "transition-[width]"
      )}>
        <section className="self-start h-20 flex flex-row gap-2 items-center shrink-0!">
          <Image src={logo} alt="page-logo" className="w-8/12!" />
          <ChunkyButton tone={"outline-primary"} className={"size-14 absolute right-3.5 z-1"} onClick={() => setOpen(!open)}>
            <Menu size={4} />
          </ChunkyButton>
        </section>
        <section className="h-full flex flex-col pt-4 justify-between items-stretch">
          <section className="w-full flex flex-col justify-center box-border gap-4">
            {/* usePathname() jest danymi z requestu, więc musi być w Suspense (cacheComponents). */}
            <Suspense fallback={<NavLinks selected="" />}>
              <ActiveNavLinks />
            </Suspense>
          </section>
          <section className="w-full">
            <AppNavFooter user={user} />
          </section>
        </section>
      </nav>

      <main className="relative! w-full min-h-dvh flex box-border overflow-x-hidden!">
        {children}
      </main>
    </section>
  );
}

// Linki nawigacji z podświetleniem aktywnej trasy (wyliczanym z adresu, bez stanu i efektu).
function ActiveNavLinks() {
  const pathName = usePathname();
  return <NavLinks selected={navLinks[pathName] ? pathName : ""} />;
}

function NavLinks({ selected }: { selected: string }) {
  return Object.entries(navLinks).map(([k, { title, icon: Icon }]) => (
    <Link key={k} href={k} className={buttonStyle(selected === k ? "primary" : "outline-none")}>
      <Icon className="size-5" /> {title}
    </Link>
  ));
}

function AppNavFooter({ user } : { user: User | null }) {

  const onSignOff = async () => {
    await authClient.signOut();
  }

  return (<section className="w-full flex flex-col justify-center gap-4">
    {user != null ? <>
      <Link href={"/profile"} className={buttonStyle("outline-primary")} >
        <UserIcon className="size-5" /> Profile
      </Link>
      <ChunkyButton onClick={onSignOff} tone={"outline-danger"} size="lg" 
        className={"justify-start h-14 gap-4 p-4.5!"} >
        <LogOut className="size-5" /> Sign Off
      </ChunkyButton>
    </>
    :
    <Link href={"/login"} className={buttonStyle("outline-primary")} >
      <LogIn className="size-5" /> Sign In
    </Link>}
  </section>);
}