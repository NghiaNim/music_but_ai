"use client";

import { useState } from "react";
import Link from "next/link";

import type { LearningModuleDef } from "../_lib/modules";
import { countCompletedInModule, getCompletedSet } from "../_lib/progress";

export function ModuleCard({ module }: { module: LearningModuleDef }) {
  const [completedCount] = useState(() =>
    typeof window === "undefined"
      ? 0
      : countCompletedInModule(getCompletedSet(), module.slug),
  );

  const total = module.units.length;
  const progress = Math.min(1, completedCount / total);
  const percent = Math.round(progress * 100);
  const isComplete = completedCount >= total;

  return (
    <Link href={`/learn/${module.slug}`}>
      <div className="bg-card flex h-full flex-col overflow-hidden rounded-2xl border shadow-sm transition-transform active:scale-[0.98]">
        <div
          className={`flex aspect-4/3 items-center justify-center bg-linear-to-br ${module.cardGradient}`}
        >
          <span className="text-5xl">{module.cardIcon}</span>
        </div>
        <div className="flex flex-1 flex-col p-3">
          <h3 className="text-sm leading-tight font-semibold">
            {module.title}
          </h3>
          <p className="text-muted-foreground mt-1 text-xs leading-snug">
            {module.description}
          </p>

          <div className="mt-auto pt-2.5">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
                {isComplete ? "Complete" : "Progress"}
              </span>
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300">
                {completedCount}/{total}
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
