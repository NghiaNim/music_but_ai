"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@acme/ui/button";

import { useTRPC } from "~/trpc/react";

interface ProfileCard {
  label: string;
  value: string;
}

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  month: "long",
  day: "numeric",
  year: "numeric",
};

function isProfileCard(value: unknown): value is ProfileCard {
  if (!value || typeof value !== "object") return false;
  const maybe = value as { label?: unknown; value?: unknown };
  return typeof maybe.label === "string" && typeof maybe.value === "string";
}

/**
 * Read-only view of the user's derived taste profile. Mirrors the
 * existing `/profile` page's visual language exactly: same wrapper
 * widths, `bg-card rounded-2xl border p-6 shadow-sm` cards, emerald
 * accents for active/positive states, pink avatar circle for the
 * badge.
 *
 * Editing is intentionally a separate action (re-walk via
 * `/onboarding/taste`, idempotent) for v1. Inline per-dimension
 * editing is a follow-up once we've validated this layout with
 * users.
 */
export function TasteProfileContent() {
  const trpc = useTRPC();

  const { data: profile, isLoading } = useQuery(
    trpc.tasteProfile.get.queryOptions(),
  );

  if (isLoading) {
    return (
      <div className="mt-5 space-y-3">
        <div className="bg-muted h-44 animate-pulse rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted h-24 animate-pulse rounded-2xl" />
          <div className="bg-muted h-24 animate-pulse rounded-2xl" />
          <div className="bg-muted h-24 animate-pulse rounded-2xl" />
          <div className="bg-muted h-24 animate-pulse rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!profile?.archetype) {
    return <EmptyState />;
  }

  const cards: ProfileCard[] = Array.isArray(profile.profileCards)
    ? profile.profileCards.filter(isProfileCard)
    : [];

  const tags = Array.isArray(profile.tags) ? profile.tags : [];

  const lastUpdated = profile.lastDerivedAt
    ? new Date(profile.lastDerivedAt).toLocaleDateString(undefined, DATE_FORMAT)
    : null;

  return (
    <>
      {/* Header card — same shape + spacing as /profile's header */}
      <div className="bg-card mt-5 rounded-2xl border p-6 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#F8E8EE] text-5xl">
            {profile.badgeEmoji ?? "♪"}
          </div>
          <p className="text-muted-foreground mt-3 text-xs font-medium tracking-wider uppercase">
            You are a
          </p>
          <p className="text-foreground mt-0.5 text-2xl font-bold text-balance">
            {profile.archetype}
          </p>

          {tags.length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2×2 grid of taste dimensions */}
      {cards.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          {cards.slice(0, 4).map((card) => (
            <div
              key={card.label}
              className="bg-card rounded-2xl border p-4 shadow-sm"
            >
              <p className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
                {card.label}
              </p>
              <p className="text-foreground mt-1 text-sm font-semibold text-balance">
                {card.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* AI-written summary */}
      {profile.profileSummary && (
        <div className="bg-card mt-3 rounded-2xl border p-5 shadow-sm">
          <p className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
            How we read you
          </p>
          <p className="text-foreground mt-2 text-sm leading-relaxed">
            {profile.profileSummary}
          </p>
        </div>
      )}

      {/* Refine — for v1 this re-runs the onboarding (idempotent). */}
      <h2 className="text-foreground mt-8 mb-3 text-lg font-bold">
        Refine your taste
      </h2>
      <Link
        href="/onboarding/taste?restart=1"
        className="bg-card hover:bg-muted/50 flex items-center gap-3 rounded-2xl border p-4 shadow-sm transition-colors"
      >
        <div className="flex size-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
          <RefineIcon />
        </div>
        <div className="flex-1">
          <p className="font-semibold">Re-take the taste quiz</p>
          <p className="text-muted-foreground text-xs">
            Tastes change — refresh your profile any time
          </p>
        </div>
        <ChevronRightIcon />
      </Link>

      {/* Footer hint — matches the muted "Tap a badge to flip it" microcopy */}
      {lastUpdated && (
        <p className="text-muted-foreground mt-6 text-center text-xs">
          Profile last updated {lastUpdated}. We'll keep refining as you
          explore.
        </p>
      )}
    </>
  );
}

function EmptyState() {
  return (
    <div className="bg-card mt-5 rounded-2xl border p-6 text-center shadow-sm">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
        <WaveformIcon />
      </div>
      <p className="text-foreground mt-3 font-semibold">Discover your sound</p>
      <p className="text-muted-foreground mt-1 text-sm">
        Take our 2-minute taste quiz and we'll find your next favourite concert.
      </p>
      <Button asChild className="mt-4">
        <Link href="/onboarding/taste">Start the quiz</Link>
      </Button>
    </div>
  );
}

function RefineIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-emerald-600 dark:text-emerald-400"
    >
      <path d="M21 12a9 9 0 1 1-3-6.7" />
      <path d="M21 4v5h-5" />
    </svg>
  );
}

function WaveformIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
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
      width="16"
      height="16"
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
