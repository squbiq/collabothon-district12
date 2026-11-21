// lib/lesson/topic-actions.ts
//
// Akcje serwerowe panelu admina: tematy (Topic) i rozdziały (Chapter).
// Każda akcja sama sprawdza rolę admina – akcje są publicznymi endpointami.
"use server";

import { refresh as refreshRouter, revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });
const clean = (v: unknown) => (typeof v === "string" ? v.trim() : "");

async function isAdmin() {
  const session = await getSession();
  return session?.user.role === "admin";
}

// Odświeża panel (menu, formularze) oraz mapę lekcji (zakładki tematów).
function refresh() {
  revalidatePath("/panel/lesson", "layout");
  revalidatePath("/lesson-map");
  // odświeża też widok klienta, który wywołał akcję
  refreshRouter();
}

export async function createTopic(title: string): Promise<Result<{ id: string }>> {
  if (!(await isAdmin())) return fail("Forbidden.");
  const topicTitle = clean(title);
  if (!topicTitle) return fail("Enter a topic name.");

  try {
    const topic = await prisma.topic.create({
      data: { topicTitle },
      select: { id: true },
    });
    refresh();
    return { ok: true, id: topic.id };
  } catch (e) {
    console.error("createTopic failed", e);
    return fail("Could not add the topic.");
  }
}

export async function renameTopic(id: string, title: string): Promise<Result> {
  if (!(await isAdmin())) return fail("Forbidden.");
  const topicTitle = clean(title);
  if (!topicTitle) return fail("Enter a topic name.");

  try {
    await prisma.topic.update({ where: { id }, data: { topicTitle } });
    refresh();
    return { ok: true };
  } catch (e) {
    console.error("renameTopic failed", e);
    return fail("Could not rename the topic.");
  }
}

export async function deleteTopic(id: string): Promise<Result> {
  if (!(await isAdmin())) return fail("Forbidden.");

  try {
    // Usunięcie tematu kasowałoby kaskadowo rozdziały i lekcje – blokujemy, gdy nie jest pusty.
    const chapters = await prisma.chapter.count({ where: { topicId: id } });
    if (chapters > 0) return fail("This topic still has chapters. Remove or move them first.");

    await prisma.topic.delete({ where: { id } });
    refresh();
    return { ok: true };
  } catch (e) {
    console.error("deleteTopic failed", e);
    return fail("Could not delete the topic.");
  }
}

// Nowy rozdział w wybranym temacie (numer = kolejny w temacie).
export async function createChapter(
  topicId: string,
  title: string
): Promise<Result<{ id: string }>> {
  if (!(await isAdmin())) return fail("Forbidden.");
  const chapterTitle = clean(title);
  if (!chapterTitle) return fail("Enter a chapter name.");

  try {
    const topic = await prisma.topic.findUnique({ where: { id: topicId }, select: { id: true } });
    if (!topic) return fail("Select a topic first.");

    const last = await prisma.chapter.aggregate({ where: { topicId }, _max: { orderNumber: true } });
    const chapter = await prisma.chapter.create({
      data: { topicId, chapterTitle, orderNumber: (last._max.orderNumber ?? 0) + 1 },
      select: { id: true },
    });
    refresh();
    return { ok: true, id: chapter.id };
  } catch (e) {
    console.error("createChapter failed", e);
    return fail("Could not add the chapter.");
  }
}
