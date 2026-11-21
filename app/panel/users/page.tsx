// app/panel/users/page.tsx
//
// Zarządzanie użytkownikami (plugin admin() better-auth): wyszukiwanie, ban, role, sesje, import/eksport.
import Link from "next/link";
import { Suspense } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { UsersTable } from "@/components/feature/users/admin/users-table";
import { UsersTransferButtons } from "@/components/feature/users/admin/users-transfer";
import { Input } from "@/components/ui/input";
import { requireAdmin } from "@/lib/session";
import { getAdminUsers } from "@/lib/users/queries";

async function UsersContent({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const session = await requireAdmin();
  const { q = "", page = "1" } = await searchParams;
  const data = await getAdminUsers(q, Number.parseInt(page, 10) || 1);
  const lastPage = Math.max(1, Math.ceil(data.total / data.pageSize));
  const href = (p: number) => `/panel/users?${new URLSearchParams({ ...(q ? { q } : {}), page: String(p) })}`;

  return (
    <>
      <form action="/panel/users" className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input name="q" defaultValue={q} placeholder="Search by e-mail, name or username" className="h-11 pl-9" aria-label="Search users" />
      </form>
      <p className="text-sm font-medium text-muted-foreground">{data.total} user(s)</p>
      <UsersTable users={data.users} currentUserId={session.user.id} />
      {lastPage > 1 && (
        <nav className="flex items-center justify-between gap-2" aria-label="Pagination">
          {data.page > 1 ? (
            <Link href={href(data.page - 1)} className="inline-flex items-center gap-1 text-sm font-bold text-primary">
              <ChevronLeft className="size-4" /> Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="text-sm text-muted-foreground">
            Page {data.page} of {lastPage}
          </span>
          {data.page < lastPage ? (
            <Link href={href(data.page + 1)} className="inline-flex items-center gap-1 text-sm font-bold text-primary">
              Next <ChevronRight className="size-4" />
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </>
  );
}

export default function UsersAdminPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  return (
    <div className="flex w-full max-w-3xl min-w-0 flex-col gap-4 px-4 pb-10 sm:px-8">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold text-foreground">Users</h1>
          <p className="font-medium text-muted-foreground">Manage accounts, roles and bans. Export or import users with their progress.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <UsersTransferButtons />
        </div>
      </header>
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        <UsersContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
