// Komponent serwerowy: pobiera listę lekcji (do wyboru przy eksporcie) dla przycisków import/eksport.
import { requireAdmin } from "@/lib/session";
import { getLessonTree } from "@/lib/lesson/admin-queries";
import { LessonTransferPanel } from "./lesson-transfer";

export async function LessonTransferLoader() {
  await requireAdmin(); // odczyt sesji = dane żądania (tryb dynamiczny) + kontrola roli
  const lessons = await getLessonTree();
  return <LessonTransferPanel lessons={lessons} />;
}
