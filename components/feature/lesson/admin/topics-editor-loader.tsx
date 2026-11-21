// Komponent serwerowy: pobiera tematy i przekazuje je do edytora (klienckiego).
import { requireAdmin } from "@/lib/session";
import { getTopics } from "@/lib/lesson/topics";
import { TopicsEditor } from "./topics-editor";

export async function TopicsEditorLoader() {
  await requireAdmin(); // odczyt sesji = dane żądania (tryb dynamiczny) + kontrola roli
  const topics = await getTopics();
  return <TopicsEditor topics={topics} />;
}
