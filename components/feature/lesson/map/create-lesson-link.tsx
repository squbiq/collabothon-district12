// Przycisk "Create lesson" – widoczny tylko dla administratora (panel wymaga roli admin).
import Link from "next/link";
import { LayersPlus } from "lucide-react";
import { chunkyButtonVariants } from "@/components/shared/chunky-button";
import { cn } from "@/lib/utils";
import { getSession } from "@/lib/session";

export async function CreateLessonLink() {
  const session = await getSession();
  if (session?.user.role !== "admin") return null;

  return (
    <Link href="/panel/lesson/create"
      className={cn(chunkyButtonVariants({ tone: "success", size: "lg" }), "fixed right-8 bottom-8")}
    >
      <LayersPlus /> Create lesson
    </Link>
  );
}
