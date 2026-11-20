"use client";

import {
  useState,
  useEffect,
  useCallback,
} from "react";

import { authClient } from "@/lib/auth-client";
import { UserContext, type UserStats } from "./user-context";

export function UserProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending } = authClient.useSession();

  const [stats, setStats] = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const refreshStats = useCallback(async () => {
    if (!session?.user) {
      setStats(null);
      return;
    }

    setStatsLoading(true);
  }, [session?.user]);

  useEffect(() => {
    if (!isPending) {
      refreshStats();
    }
  }, [isPending, refreshStats]);

  return (
    <UserContext.Provider
      value={{
        user: session?.user ?? null,
        stats,
        isLoading: isPending || statsLoading,
        refreshStats,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}