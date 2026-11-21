import { Suspense } from "react";
import { requireAdmin } from "@/lib/session";

// Sprawdzenie roli korzysta z nagłówków/cookies (dane z requestu), więc musi być w Suspense.
// Treść panelu renderuje się dopiero po przejściu kontroli admina.
async function AdminGuard({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <>{children}</>;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="w-full min-h-full flex justify-evenly items-start pt-10 box-border">
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        <AdminGuard>{children}</AdminGuard>
      </Suspense>
    </section>
  );
}
