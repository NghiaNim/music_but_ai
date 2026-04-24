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

export function LearningProgress() {
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

  return (
    <Link
      href="/learn"
      className="bg-card block rounded-2xl border p-5 shadow-sm transition-transform active:scale-[0.995]"
    >
      <div className="flex items-center gap-4">
        <div className="bg-muted flex size-16 shrink-0 items-center justify-center rounded-full text-3xl">
          {current.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            Level {levelNumber}
          </p>
          <h3 className="text-foreground text-xl font-bold">{current.name}</h3>
          <p className="text-muted-foreground mt-0.5 text-xs">
            ⭐ {points} XP total
          </p>
        </div>
      </div>

      <div className="mt-4">
        <div className="text-muted-foreground mb-1.5 flex items-center justify-between text-[11px] font-medium">
          {next != null ? (
            <>
              <span>
                {next.emoji} Next: {next.name}
              </span>
              <span className="tabular-nums">
                {xpIntoLevel} / {xpForLevel} XP
              </span>
            </>
          ) : (
            <span>🎉 Max level reached!</span>
          )}
        </div>
        <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
          <div
            className="h-full bg-linear-to-r from-amber-400 to-orange-500 transition-all"
            style={{ width: `${Math.round(levelProgress * 100)}%` }}
          />
        </div>
      </div>
    </Link>
  );
}
