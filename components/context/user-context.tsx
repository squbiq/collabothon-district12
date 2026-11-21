"use client";

import { createContext, useContext } from "react";
import { authClient } from "@/lib/auth-client";
import { useState, useCallback } from "react";

export type User = typeof authClient.$Infer.Session.user;

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

export const UserContext = createContext<UserContextType | undefined>(undefined);

export function useUser() {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error("useUser must be used inside UserProvider");
  }

  return context;
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user ?? null;
  const userId = user?.id;

  const [stats, setStats] = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Odświeżanie statystyk wywołujemy ręcznie (np. po ukończeniu lekcji), a nie w useEffect:
  // wywołanie setState w efekcie powoduje dodatkowe renderowanie.
  const refreshStats = useCallback(async () => {
    if (!userId) return;

    setStatsLoading(true);
    try {
      // TODO: pobrać statystyki użytkownika z serwera i zapisać je przez setStats(...)
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, [userId]);

  return (
    <UserContext.Provider
      value={{
        user,
        // po wylogowaniu statystyki znikają (wyliczone z usera, bez efektu)
        stats: user ? stats : null,
        isLoading: isPending || statsLoading,
        refreshStats,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}
