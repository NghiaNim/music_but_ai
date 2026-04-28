"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "~/trpc/react";

const LEVEL_LABELS: Record<string, string> = {
  new: "Newcomer",
  casual: "Casual Listener",
  enthusiast: "Enthusiast",
};

const LEVEL_DESCRIPTIONS: Record<string, string> = {
  new: "We'll help you find the perfect first concert",
  casual: "We've got recommendations matched to your taste",
  enthusiast: "Curated picks for the refined ear",
};

export function OnboardingCTA({ isSignedIn }: { isSignedIn: boolean }) {
  const trpc = useTRPC();

  const { data: profile, isLoading } = useQuery({
    ...trpc.userProfile.get.queryOptions(),
    enabled: isSignedIn,
  });

  if (isLoading && isSignedIn) {
    return (
      <div className="bg-muted h-[88px] animate-pulse rounded-xl border" />
    );
  }

  // Prefer the new taste profile (archetype + badge) when present;
  // fall back to the legacy experience-level state for users who only
  // completed the old voice flow.
  if (isSignedIn && profile?.archetype) {
    return (
      <Link href="/profile" className="block">
        <div className="flex items-center gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-2xl dark:bg-emerald-900/30">
            {profile.badgeEmoji ?? "♪"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{profile.archetype}</p>
            <p className="text-muted-foreground truncate text-xs">
              {profile.tags && profile.tags.length > 0
                ? profile.tags.slice(0, 3).join(" · ")
                : "Personalized picks ready for you"}
            </p>
          </div>
          <ChevronRightIcon />
        </div>
      </Link>
    );
  }

  if (isSignedIn && profile?.onboardingCompleted) {
    return (
      <div className="flex items-center gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
          <CheckCircleIcon />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">
            {LEVEL_LABELS[profile.experienceLevel] ?? "Music Lover"}
          </p>
          <p className="text-muted-foreground text-xs">
            {LEVEL_DESCRIPTIONS[profile.experienceLevel] ??
              "Personalized picks ready for you"}
          </p>
        </div>
        {profile.musicTasteEasy != null && (
          <div className="flex gap-1">
            {[
              profile.musicTasteEasy,
              profile.musicTasteMedium,
              profile.musicTasteHard,
            ]
              .filter((v): v is number => v != null)
              .map((rating, i) => (
                <div
                  key={i}
                  className="flex size-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                >
                  {rating}
                </div>
              ))}
          </div>
        )}
      </div>
    );
  }

  if (isSignedIn) {
    return (
      <Link href="/onboarding/taste" className="block">
        <div className="flex items-center gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <WaveformIcon />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Discover your sound</p>
            <p className="text-muted-foreground text-xs">
              2 min — five quick taps and we'll find your next concert
            </p>
          </div>
          <ChevronRightIcon />
        </div>
      </Link>
    );
  }

  return (
    <Link href="/sign-in?callbackUrl=/onboarding/taste" className="block">
      <div className="flex items-center gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
          <WaveformIcon />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Sign in & discover your sound</p>
          <p className="text-muted-foreground text-xs">
            2 min — five taps to your personalized picks
          </p>
        </div>
        <ChevronRightIcon />
      </div>
    </Link>
  );
}

function CheckCircleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-emerald-600 dark:text-emerald-400"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function WaveformIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-emerald-600 dark:text-emerald-400"
    >
      <path d="M2 13a2 2 0 0 0 2-2V7a2 2 0 0 1 4 0v13a2 2 0 0 0 4 0V4a2 2 0 0 1 4 0v13a2 2 0 0 0 4 0v-4a2 2 0 0 1 2-2" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-muted-foreground"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
