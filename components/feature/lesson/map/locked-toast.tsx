// Pokazuje tost po przekierowaniu z zablokowanej lekcji (?locked=1) i czyści parametr z adresu.
"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { showLockedLessonToast } from "./lesson-card";

export function LockedToast() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const locked = params.get("locked") === "1";

  useEffect(() => {
    if (!locked) return;
    showLockedLessonToast(false);
    const next = new URLSearchParams(params.toString());
    next.delete("locked");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [locked, params, pathname, router]);

  return null;
}
