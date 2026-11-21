// Komponent serwerowy: pobiera tematy i przekazuje je do edytora (klienckiego).
import { connection } from "next/server";
import { getTopics } from "@/lib/lesson/topics";
import { TopicsEditor } from "./topics-editor";

export async function TopicsEditorLoader() {
  await connection();
  const topics = await getTopics();
  return <TopicsEditor topics={topics} />;
}
