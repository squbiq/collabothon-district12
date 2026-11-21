// Informacja dla niezalogowanych: mapa lekcji działa tylko po zalogowaniu.
import Link from "next/link";
import { LogIn } from "lucide-react";
import { chunkyButtonVariants } from "@/components/shared/chunky-button";

export function LoginRequiredNotice() {
  return (
    <div
      role="status"
      className="flex flex-col items-start gap-3 rounded-2xl border-2 border-amber-300 bg-amber-100 p-5 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200"
    >
      <p className="font-bold">This feature is only available to logged-in users.</p>
      <p className="text-sm font-medium">Sign in to open lessons and track your progress.</p>
      <Link href="/login" className={chunkyButtonVariants({ tone: "primary" })}>
        <LogIn /> Sign in
      </Link>
    </div>
  );
}
