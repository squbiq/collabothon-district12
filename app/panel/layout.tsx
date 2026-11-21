import { Suspense } from "react";
import { requireAdmin } from "@/lib/session";
import { PanelNav } from "@/components/feature/panel/panel-nav";

// Sprawdzenie roli korzysta z nagłówków/cookies (dane z requestu), więc musi być w Suspense.
// Treść panelu renderuje się dopiero po przejściu kontroli admina.
async function AdminGuard({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <>{children}</>;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="w-full min-h-full flex flex-col gap-8 pt-6 box-border">
      <PanelNav />
      <div className="flex w-full flex-1 justify-evenly items-start">
        <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
          <AdminGuard>{children}</AdminGuard>
        </Suspense>
      </div>
    </section>
  );
}
