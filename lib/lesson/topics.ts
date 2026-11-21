// lib/lesson/topics.ts
//
// Tematy (ścieżki nauki) z tabeli Topic – używane m.in. przez PathSwitcher na mapie lekcji.
import { prisma } from "@/lib/prisma";

export type TopicOption = { id: string; title: string };

export async function getTopics(): Promise<TopicOption[]> {
  const rows = await prisma.topic.findMany({ orderBy: [{ id: "asc" }, { topicTitle: "asc" }] });
  return rows.map((t) => ({ id: t.id, title: t.topicTitle }));
}

// Wybrany temat z parametru ?path=; gdy brak lub nieznany – pierwszy z listy.
export function resolveTopic(topics: TopicOption[], id?: string): TopicOption | undefined {
  return topics.find((t) => t.id === id) ?? topics[0];
}
