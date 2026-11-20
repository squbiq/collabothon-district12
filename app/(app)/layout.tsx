import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";


export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <section className="w-dvw h-dvh flex flex-col">
      <section className="w-dvw h-16 px-4 py-1 flex flex-row border justify-between items-center">

        <section>
          finanz.io
        </section>

        <section className="flex flex-row gap-2">
          <Link href={"/daily-lesson"} className={buttonVariants()} >Daily lesson</Link>
          <Link href={"/lesson-map"} className={buttonVariants()} >Lessons</Link>
        </section>

        <section>
          <Button size={"lg"} >Sign In</Button>
        </section>

      </section>

      <section className="w-dvw h-full flex justify-center items-center">
        {children}
      </section>
    </section>
  );
}
