import { buttonVariants } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import logo from "@/public/logo-all.svg"
import { cn } from "cn";
import { BookOpen, CalendarDays, User } from "lucide-react";


export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <section className="w-dvw h-dvh flex flex-col">
      <section className="w-dvw h-18 px-4 py-1 flex flex-row border justify-between items-center">

        <Image src={logo} alt="page-logo" className="w-auto h-full" />

        <section className="flex flex-row gap-2">

          <Link href={"/daily-lesson"} className={cn(buttonVariants({ size: "xl" }) )} >
            <CalendarDays className="size-5" /> Daily lesson
          </Link>
          <Link href={"/lesson-map"} className={buttonVariants({ size: "xl" })} >
            <BookOpen className="size-5" /> Lessons
          </Link>
          <Link href={"/arena"} className={buttonVariants({ size: "xl" })} >
            <BookOpen className="size-5" /> Arena
          </Link>
          <Link href={"/panel"} className={buttonVariants({ size: "xl" })} >
            <BookOpen className="size-5" /> Panel
          </Link>
        </section>

        <section>
          <Link href={"#"} className={buttonVariants({ size: "xl" })} >
            <User className="size-5" /> Invest with us / Sign up
          </Link>
        </section>

      </section>

      <section className="w-full h-full flex justify-center items-start box-border overflow-x-hidden!">
        {children}
      </section>
    </section>
  );
}
