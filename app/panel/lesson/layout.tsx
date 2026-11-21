// app/panel/lesson/layout.tsx
//
// Układ panelu lekcji: po lewej przycisk "Create lesson" i menu lekcji/etapów, po prawej treść trasy.
import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { chunkyButtonVariants } from "@/components/shared/chunky-button";
import { LessonMenuLoader } from "@/components/feature/lesson/admin/lesson-menu-loader";
import { LessonTransferPanel } from "@/components/feature/lesson/admin/lesson-transfer";
import { TopicsEditorLoader } from "@/components/feature/lesson/admin/topics-editor-loader";

export default function LessonAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full min-w-0 items-start gap-8 px-8 pb-10">
      <aside className="sticky top-6 flex w-72 shrink-0 flex-col gap-4">
        <Link href="/panel/lesson/create" className={chunkyButtonVariants({ tone: "success", size: "lg", fullWidth: true })}>
          <Plus /> Create lesson
        </Link>
        <LessonTransferPanel />
        <Suspense fallback={<p className="text-sm text-muted-foreground">Loading topics…</p>}>
          <TopicsEditorLoader />
        </Suspense>
        <Suspense fallback={<p className="text-sm text-muted-foreground">Loading lessons…</p>}>
          <LessonMenuLoader />
        </Suspense>
      </aside>

      <div className="min-w-0 max-w-2xl flex-1">{children}</div>
    </div>
  );
}
