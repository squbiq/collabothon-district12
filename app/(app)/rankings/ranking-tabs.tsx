"use client";

import { useState } from "react";
import { BookCheck, Flame, Zap } from "lucide-react";

import { ChunkyButton } from "@/components/shared/chunky-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Ranking, RankingEntry, Rankings } from "@/lib/rankings";

const TABS = [
  { key: "lessons", label: "Lessons", title: "Completed lessons", unit: "lessons", Icon: BookCheck },
  { key: "streak", label: "Streak", title: "Current streak", unit: "days", Icon: Flame },
  { key: "xp", label: "XP", title: "Total XP", unit: "XP", Icon: Zap },
] as const;

const MEDAL: Record<number, string> = {
  1: "bg-yellow-400 text-yellow-950",
  2: "bg-slate-300 text-slate-900",
  3: "bg-orange-400 text-orange-950",
};

function Row({ entry, unit }: { entry: RankingEntry; unit: string }) {
  return (
    <li
      className={`flex items-center gap-3 rounded-2xl border-2 px-3 py-2 ${
        entry.isMe ? "border-green-500 bg-green-500/10" : "border-border"
      }`}
    >
      <span
        className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${
          MEDAL[entry.rank] ?? "bg-muted text-muted-foreground"
        }`}
      >
        {entry.rank}
      </span>
      <span className="flex-1 truncate font-bold">
        {entry.name}
        {entry.isMe && " (you)"}
      </span>
      <span className="font-extrabold tabular-nums">
        {entry.value.toLocaleString("en-US")}{" "}
        <span className="text-xs font-semibold text-muted-foreground">{unit}</span>
      </span>
    </li>
  );
}

function RankingList({ ranking, unit }: { ranking: Ranking; unit: string }) {
  if (ranking.top.length === 0) {
    return <p className="text-muted-foreground">No one is on the board yet. You can change that!</p>;
  }

  return (
    <ol className="flex flex-col gap-2">
      {ranking.top.map((e) => (
        <Row key={e.userId} entry={e} unit={unit} />
      ))}
      {ranking.me && (
        <>
          <li aria-hidden className="text-center text-muted-foreground">⋯</li>
          <Row entry={ranking.me} unit={unit} />
        </>
      )}
    </ol>
  );
}

export function RankingTabs({ rankings }: { rankings: Rankings }) {
  const [active, setActive] = useState<(typeof TABS)[number]["key"]>("lessons");
  const tab = TABS.find((t) => t.key === active)!;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-2">
        {TABS.map(({ key, label, Icon }) => (
          <ChunkyButton
            key={key}
            type="button"
            size="sm"
            fullWidth
            tone={active === key ? "primary" : "outline-none"}
            onClick={() => setActive(key)}
            aria-pressed={active === key}
          >
            <Icon />
            {label}
          </ChunkyButton>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <tab.Icon className="size-5" />
            {tab.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RankingList ranking={rankings[active]} unit={tab.unit} />
        </CardContent>
      </Card>
    </div>
  );
}