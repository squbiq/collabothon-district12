// Komponent serwerowy: pobiera lekcje i przekazuje je do menu (klienckiego).
import { connection } from "next/server";
import { getLessonTree } from "@/lib/lesson/admin-queries";
import { LessonMenu } from "./lesson-menu";

export async function LessonMenuLoader() {
  await connection(); // dane zależne od żądania – nie pobieramy ich podczas prerenderu
  const lessons = await getLessonTree();
  return <LessonMenu lessons={lessons} />;
}
