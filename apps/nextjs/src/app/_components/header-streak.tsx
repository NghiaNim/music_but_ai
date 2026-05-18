"use client";

import { usePathname } from "next/navigation";

import { useStreakDays } from "~/app/learn/_lib/use-streak-days";

/** Compact 🔥 streak for the global top bar on Learn routes. */
export function HeaderStreak() {
  const pathname = usePathname();
  const daysOnApp = useStreakDays();

  if (!pathname.startsWith("/learn")) return null;

  return (
    <div
      className="bg-card flex min-w-[52px] shrink-0 flex-col items-center rounded-xl border px-2 py-1 shadow-sm"
      title="Day streak on Classica"
    >
      <p className="text-muted-foreground flex items-center gap-0.5 text-[9px] font-medium leading-none">
        <span aria-hidden>🔥</span>
        <span>Streak</span>
      </p>
      <p className="mt-0.5 text-base leading-none font-bold tabular-nums">
        {daysOnApp}
      </p>
    </div>
  );
}
