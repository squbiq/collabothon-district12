"use client"

import { ChunkyButton } from "@/components/shared/chunky-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "cn"
import { useState } from "react"

interface QuastAB {
  title: string,
  description: string,
  options: Record<string, {
    correct: boolean,
    feedback: string
  }>
}

export const testQuestAB: QuastAB = {
  title: "How much money stays in your pocket?",
  description: "Over the years you invested and made €100,000 in pure profit. Normally the state takes 19% of it in tax.",
  options: {
    "€81,000": { correct: false, feedback: "Not this time! If you follow the simple rules of a tax-advantaged retirement account, the state takes nothing. See how this tax shield works." },
    "€100,000": { correct: true, feedback: "Exactly! You save a full €19,000. See how this special account works and why it is not an ordinary deposit." }
  }
}

export function QuestABBlock({ questData }:{ questData: QuastAB }) {

  const [selected, setSelected] = useState<string>("");

  const selectOption = (value: string) => { 
    if(selected == "") { setSelected(value); }
  };

  return (
    <Card className="w-full max-w-200 px-2 py-5!">
      <CardHeader>
        <CardTitle className="text-xl">{questData.title}</CardTitle>
        <CardDescription>{questData.description}</CardDescription>
      </CardHeader>
      <CardContent className="w-full flex flex-col gap-4">
        <section className="w-full flex flex-col gap-4 sm:h-12 sm:flex-row">
          {Object.entries(questData.options).map(([k, v]) => (
            <ChunkyButton tone="outline-primary" key={k} onClick={() => selectOption(k)} className={
                cn("w-full h-full shrink cursor-pointer border", 
                  selected == k ? v.correct == true ? "border-green-500!" : "border-red-500!" : "")
              } 
              >{k}</ChunkyButton>
          ))}
        </section>
        { selected != "" ? <section className="flex items-center justify-center">
          <p className="w-9/10 text-center text-lg">{questData.options[selected].feedback}</p>
        </section> : "" }
      </CardContent>
    </Card>
  );
}
