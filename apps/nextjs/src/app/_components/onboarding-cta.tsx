"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "~/trpc/react";


export function OnboardingCTA({ isSignedIn }: { isSignedIn: boolean }) {
  const trpc = useTRPC();

  const { data: profile, isLoading } = useQuery({
    ...trpc.userProfile.get.queryOptions(),
    enabled: isSignedIn,
  });

  if (isLoading && isSignedIn) {
    return (
      <div className="px-4 pb-4">
        <div className="bg-muted h-[88px] animate-pulse rounded-xl border" />
      </div>
    );
  }

  // Hide the card once the user has completed the taste quiz (new or legacy flow).
  if (isSignedIn && (profile?.archetype ?? profile?.onboardingCompleted)) {
    return null;
  }

  if (isSignedIn) {
    return (
      <div className="px-4 pb-4">
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
      </div>
    );
  }

  return (
    <div className="px-4 pb-4">
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
    </div>
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
