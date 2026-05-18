"use client";

import { usePathname } from "next/navigation";

import { useStreakDays } from "~/app/learn/_lib/use-streak-days";

/** Compact 🔥 streak for the global top bar on Learn routes. */
export function HeaderStreak() {
  const pathname = usePathname();
  const daysOnApp = useStreakDays();

  if (!pathname.startsWith("/learn")) return null;

  return (
    <div className="flex justify-end px-4 py-1.5">
      <div
        className="bg-card flex items-center gap-1.5 rounded-full border px-3 py-1 shadow-sm"
        title="Day streak on Classica"
      >
        <span aria-hidden className="text-lg">
          🔥
        </span>
        <span className="text-lg font-bold tabular-nums">{daysOnApp}</span>
      </div>
    </div>
  );
}
