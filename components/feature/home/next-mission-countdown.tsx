// Odliczanie do następnej misji dziennej (północ UTC, tak jak streak). Zegar czyta tylko klient po hydracji.
"use client";

import { useSyncExternalStore } from "react";

const DAY_MS = 86_400_000;

function subscribe(onTick: () => void) {
  const id = setInterval(onTick, 1000);
  return () => clearInterval(id);
}
// zaokrąglenie do sekundy – snapshot nie zmienia się między renderami w tej samej sekundzie
const snapshot = () => Math.floor((DAY_MS - (Date.now() % DAY_MS)) / 1000);

const pad = (n: number) => String(n).padStart(2, "0");

export function NextMissionCountdown() {
  const left = useSyncExternalStore(subscribe, snapshot, () => null);
  if (left === null) return <span className="tabular-nums">--:--:--</span>;
  return (
    <span className="tabular-nums">
      {pad(Math.floor(left / 3600))}:{pad(Math.floor((left % 3600) / 60))}:{pad(left % 60)}
    </span>
  );
}
