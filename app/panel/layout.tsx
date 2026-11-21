import { Suspense, ViewTransition } from "react";
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
      {/* nawigacja panelu: wjeżdża z góry przy wejściu z / i chowa się do góry przy wyjściu */}
      <ViewTransition name="panel-nav" enter={{ "to-panel": "panel-nav-in", default: "none" }} exit={{ "to-app": "panel-nav-out", default: "none" }} default="none">
        <PanelNav />
      </ViewTransition>
      <Suspense fallback={<p className="px-8 text-muted-foreground">Loading…</p>}>
        <AdminGuard>{children}</AdminGuard>
      </Suspense>
    </section>
  );
}
