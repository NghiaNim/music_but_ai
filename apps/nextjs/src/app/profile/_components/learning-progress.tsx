"use client";

import { useState } from "react";
import Link from "next/link";

import { getStoredNumber, POINTS_KEY } from "../../learn/_lib/progress";

// Level thresholds (in XP / points)
const LEVELS = [
  { min: 0, name: "Newcomer", emoji: "🌱" },
  { min: 20, name: "Curious Listener", emoji: "👂" },
  { min: 50, name: "Music Explorer", emoji: "🧭" },
  { min: 100, name: "Seasoned Ear", emoji: "🎧" },
  { min: 160, name: "Music Connoisseur", emoji: "🏆" },
] as const;

type Level = (typeof LEVELS)[number];

function getLevel(points: number) {
  let current: Level = LEVELS[0];
  for (const level of LEVELS) {
    if (points >= level.min) current = level;
  }
  const currentIndex = LEVELS.findIndex((l) => l.name === current.name);
  const next = LEVELS[currentIndex + 1];
  return { current, next, currentIndex };
}

export function LearningProgress({
  compact = false,
}: {
  compact?: boolean;
}) {
  const [points] = useState(() =>
    typeof window === "undefined" ? 0 : getStoredNumber(POINTS_KEY),
  );

  const { current, next, currentIndex } = getLevel(points);
  const levelStart = current.min;
  const levelEnd = next?.min ?? levelStart + 40;
  const levelProgress =
    next != null
      ? Math.min(1, (points - levelStart) / (levelEnd - levelStart))
      : 1;
  const levelNumber = currentIndex + 1;
  const xpIntoLevel = points - levelStart;
  const xpForLevel = (next?.min ?? levelEnd) - levelStart;
  const progressPercent = Math.round(levelProgress * 100);

  return (
    <Link
      href="/learn"
      className={
        compact
          ? "bg-muted/40 hover:bg-muted/60 block rounded-2xl border p-4 transition-colors active:scale-[0.995]"
          : "bg-card hover:bg-muted/40 block rounded-2xl border p-5 shadow-sm transition-colors active:scale-[0.995]"
      }
    >
      <div className="flex items-start gap-3.5">
        <div
          className={
            compact
              ? "bg-background mt-0.5 flex size-12 shrink-0 items-center justify-center rounded-full border text-2xl"
              : "bg-muted mt-0.5 flex size-14 shrink-0 items-center justify-center rounded-full border text-3xl"
          }
        >
          {current.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
              Learning level
            </p>
            <span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide">
              LV {levelNumber}
            </span>
          </div>
          <h3
            className={
              compact
                ? "text-foreground mt-1 text-base font-bold leading-tight"
                : "text-foreground mt-1 text-xl font-bold leading-tight"
            }
          >
            {current.name}
          </h3>
          <p className="text-muted-foreground mt-1 text-xs">⭐ {points} XP total</p>
        </div>
      </div>

      <div className="mt-3.5">
        <div className="text-muted-foreground mb-2 flex items-center justify-between text-[11px] font-medium">
          {next != null ? (
            <>
              <span className="truncate pr-2">
                Next: {next.emoji} {next.name}
              </span>
              <span className="tabular-nums">{progressPercent}%</span>
            </>
          ) : (
            <>
              <span>🎉 Max level reached!</span>
              <span className="tabular-nums">100%</span>
            </>
          )}
        </div>

        <div className="bg-muted h-2.5 w-full overflow-hidden rounded-full">
          <div
            className="h-full rounded-full bg-linear-to-r from-amber-400 via-orange-500 to-rose-500 transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="mt-2.5 flex items-center justify-between text-[11px]">
          {next != null ? (
            <>
              <span className="text-muted-foreground">
                {xpIntoLevel} / {xpForLevel} XP
              </span>
              <span className="text-foreground font-medium">+{xpForLevel - xpIntoLevel} XP to go</span>
            </>
          ) : (
            <span className="text-muted-foreground">All milestones complete</span>
          )}
        </div>
      </div>
    </Link>
  );
}
