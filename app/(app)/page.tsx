import { QuestABBlock, testQuestAB } from "@/components/quests/ab";
import { ChartBarInteractive } from "@/components/shared/bar-charts";

export default function Home() {
  return (  
    <div className="flex flex-col flex-1 gap-8 items-center justify-center bg-zinc-50 font-sans dark:bg-black shrink-0!">
      <ChartBarInteractive className="w-8/12" />
    </div>
  );
}
