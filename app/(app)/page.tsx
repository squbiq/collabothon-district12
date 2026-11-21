import { Suspense } from "react";
import { getSession } from "@/lib/session";
import { getHomeData } from "@/lib/home";
import { HomeDashboard } from "@/components/feature/home/home-dashboard";

async function HomeContent() {
  // sesja czyta nagłówki żądania, więc dalsze zapytania i zegar działają już w trybie dynamicznym
  const session = await getSession();
  const data = await getHomeData(session?.user.id);
  return <HomeDashboard data={data} />;
}

export default function Home() {
  return (
    <div className="flex h-full w-full overflow-y-auto">
      <Suspense fallback={<p className="m-auto font-bold text-muted-foreground">Loading…</p>}>
        <HomeContent />
      </Suspense>
    </div>
  );
}
