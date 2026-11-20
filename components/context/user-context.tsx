"use client";

import { createContext, useContext } from "react";
import { authClient } from "@/lib/auth-client";
import {
  useState,
  useEffect,
  useCallback,
} from "react";

type User = typeof authClient.$Infer.Session.user;

// przechowuje dane usera (na razie zobaczymy co tu damy)
export type UserStats = {
  completedLessons: number;
  totalLessons: number;
};

type UserContextType = {
  user: User | null;
  stats: UserStats | null;
  isLoading: boolean;
  refreshStats: () => Promise<void>;
};

export const UserContext = createContext<UserContextType | undefined>(
  undefined
);

export function useUser() {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error("useUser must be used inside UserProvider");
  }

  return context;
}

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