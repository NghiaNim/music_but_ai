"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const COMPLETED_KEY = "classica-completed-modules";
const TOTAL_UNITS = 2;

export function InstrumentsCard() {
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(COMPLETED_KEY);
      if (!raw) return;
      const ids = JSON.parse(raw) as string[];
      setCompletedCount(ids.length);
    } catch {
      /* ignore */
    }
  }, []);

  const progress = Math.min(1, completedCount / TOTAL_UNITS);
  const percent = Math.round(progress * 100);
  const isComplete = completedCount >= TOTAL_UNITS;

  return (
    <Link href="/learn/instruments">
      <div className="bg-card flex h-full flex-col overflow-hidden rounded-2xl border shadow-sm transition-transform active:scale-[0.98]">
        <div className="flex aspect-4/3 items-center justify-center bg-linear-to-br from-amber-100 to-amber-50 dark:from-amber-950/40 dark:to-amber-900/20">
          <span className="text-5xl">🎻</span>
        </div>
        <div className="flex flex-1 flex-col p-3">
          <h3 className="text-sm leading-tight font-semibold">
            Meet the Instruments
          </h3>
          <p className="text-muted-foreground mt-1 text-xs leading-snug">
            Interactive modules & quizzes — earn points!
          </p>

          <div className="mt-auto pt-2.5">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
                {isComplete ? "Complete" : "Progress"}
              </span>
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300">
                {completedCount}/{TOTAL_UNITS}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div
                className="h-full bg-linear-to-r from-amber-400 to-orange-400 transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
