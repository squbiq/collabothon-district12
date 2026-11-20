"use client"

import { Button } from "@/components/ui/button"
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
  title: "Ile pieniędzy zostanie w Twojej kieszeni?",
  description: "Przez lata inwestowałeś i wypracowałeś 100 000 zł czystego zysku. Zwykle państwo zabiera z tego 19%",
  options: {
    "81 000 zł": { correct: false, feedback: "Nie tym razem! Jeśli trzymasz się prostych zasad IKE, państwo nie zabiera ani grosza. Zobacz, jak działa ta tarcza podatkowa." },
    "100 000 zł": { correct: true, feedback: "Dokładnie tak! Oszczędzasz aż 19 000 zł. Zobacz, jak działa to specjalne konto i dlaczego nie jest to zwykła lokata." }
  }
}

export function QuestABBlock({ questData }:{ questData: QuastAB }) {

  const [selected, setSelected] = useState<string>("");

  const selectOption = (value: string) => { 
    if(selected == "") { setSelected(value); }
  };

  return (
    <Card className="w-200 px-2 py-5!">
      <CardHeader>
        <CardTitle className="text-xl">{questData.title}</CardTitle>
        <CardDescription>{questData.description}</CardDescription>
      </CardHeader>
      <CardContent className="w-full flex flex-col gap-4">
        <section className="w-full h-12 flex flex-row gap-4">
          {Object.entries(questData.options).map(([k, v]) => (
            <Button key={k} variant={"outline"} onClick={() => selectOption(k)} className={
                cn("w-full h-full shrink cursor-pointer border", 
                  selected == k ? v.correct == true ? "border-green-500!" : "border-red-500!" : "")
              } 
              >{k}</Button>
          ))}
        </section>
        { selected != "" ? <section className="flex items-center justify-center">
          <p className="w-9/10 text-center text-lg">{questData.options[selected].feedback}</p>
        </section> : "" }
      </CardContent>
    </Card>
  );
}
