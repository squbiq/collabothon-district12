// Komponent serwerowy: pobiera lekcje i przekazuje je do menu (klienckiego).
import { requireAdmin } from "@/lib/session";
import { getLessonTree } from "@/lib/lesson/admin-queries";
import { LessonMenu } from "./lesson-menu";

export async function LessonMenuLoader() {
  await requireAdmin(); // odczyt sesji = dane żądania (tryb dynamiczny) + kontrola roli
  const lessons = await getLessonTree();
  return <LessonMenu lessons={lessons} />;
}
