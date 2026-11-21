// components/feature/arena/arena-hub.tsx
//
// Wybór trybu areny: walka z botem (z trudnością) albo gra online z drugim graczem.
"use client";

import { useState, type ReactNode } from "react";
import { Bot, Swords } from "lucide-react";
import { chunkyButtonVariants } from "@/components/shared/chunky-button";
import { ONLINE_QUESTION_SECONDS } from "@/lib/arena/config";
import { cn } from "@/lib/utils";
import { ArenaDuel } from "./arena-duel";
import { ArenaOnline } from "./arena-online";

type Mode = "menu" | "bot" | "online";

/** `rounds` = ile pytań naprawdę będzie w grze (z puli w bazie), żeby opisy zgadzały się z grą. */
export function ArenaHub({ rounds }: { rounds: number }) {
  const [mode, setMode] = useState<Mode>("menu");
  const back = () => setMode("menu");

  if (rounds === 0) {
    return (
      <p role="status" className="mx-auto max-w-xl text-center font-medium text-muted-foreground">
        The arena has no questions yet. Add daily tasks in the admin panel to fill it.
      </p>
    );
  }

  if (mode === "bot") return <ArenaDuel rounds={rounds} onExit={back} />;
  if (mode === "online") return <ArenaOnline rounds={rounds} onExit={back} onPlayBot={() => setMode("bot")} />;

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-4 sm:grid-cols-2">
      <ModeTile
        icon={<Bot className="size-10 text-amber-500" />}
        title="Duel the bot"
        description={`${rounds} ${rounds === 1 ? "question" : "questions"}, no pressure. Pick easy, medium or hard.`}
        onClick={() => setMode("bot")}
      />
      <ModeTile
        icon={<Swords className="size-10 text-sky-500" />}
        title="Play online"
        description={`Race another player on the same ${rounds} ${rounds === 1 ? "question" : "questions"}. ${ONLINE_QUESTION_SECONDS} seconds each – speed counts.`}
        onClick={() => setMode("online")}
      />
    </div>
  );
}

function ModeTile({ icon, title, description, onClick }: { icon: ReactNode; title: string; description: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        chunkyButtonVariants({ tone: "outline-primary", size: "lg" }),
        "h-auto flex-col items-start gap-3 p-6 text-left whitespace-normal normal-case"
      )}
    >
      {icon}
      <span className="text-xl font-extrabold uppercase">{title}</span>
      <span className="text-sm font-medium text-muted-foreground">{description}</span>
    </button>
  );
}
