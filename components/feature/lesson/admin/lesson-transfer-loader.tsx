// Komponent serwerowy: pobiera listę lekcji (do wyboru przy eksporcie) dla przycisków import/eksport.
import { connection } from "next/server";
import { getLessonTree } from "@/lib/lesson/admin-queries";
import { LessonTransferPanel } from "./lesson-transfer";

export async function LessonTransferLoader() {
  await connection();
  const lessons = await getLessonTree();
  return <LessonTransferPanel lessons={lessons} />;
}
