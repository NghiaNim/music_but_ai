"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { cn } from "@acme/ui";
import { Button } from "@acme/ui/button";

interface ProfileCard {
  label: string;
  value: string;
}

interface ProfileShape {
  archetype: string | null;
  badgeEmoji: string | null;
  tags: string[] | null;
  profileSummary: string | null;
  profileCards: ProfileCard[] | null;
}

interface RevealProps {
  profile: ProfileShape | null;
  /** True while we're still calling tasteProfile.derive. */
  isLoading: boolean;
}

const LOADING_MESSAGES = [
  "Mapping your emotional landscape",
  "Cross-referencing 300 years of repertoire",
  "Finding your sonic fingerprint",
  "Crafting your taste profile",
];

/**
 * The end-of-onboarding reveal. Same component is also reachable via
 * the resume-on-already-complete branch in `visual-cards-flow`.
 *
 * Visual language is matched to the rest of the app (`bg-card`,
 * `rounded-2xl`, emerald accents) so it doesn't feel like a one-off
 * marketing screen.
 */
export function MinimalReveal({ profile, isLoading }: RevealProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!isLoading) return;
    const id = window.setInterval(() => {
      setMessageIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 1800);
    return () => window.clearInterval(id);
  }, [isLoading]);

  if (isLoading || !profile?.archetype) {
    return (
      <div className="flex flex-col items-center gap-6 py-12 text-center">
        <PulsingDot />
        <p
          key={messageIndex}
          className="text-muted-foreground animate-in fade-in text-sm duration-500"
        >
          {LOADING_MESSAGES[messageIndex]}…
        </p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-5 px-4 py-6 sm:px-5 sm:py-8">
      {/* Header card — mirrors /profile header card */}
      <div className="bg-card w-full rounded-2xl border p-6 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <div className="animate-in fade-in zoom-in-95 flex size-24 items-center justify-center rounded-full bg-[#F8E8EE] text-5xl duration-700">
            {profile.badgeEmoji ?? "♪"}
          </div>
          <p className="text-muted-foreground mt-4 text-xs font-medium tracking-wider uppercase">
            You are a
          </p>
          <h1 className="animate-in fade-in slide-in-from-bottom-2 mt-1 text-2xl font-bold text-balance duration-700 md:text-3xl">
            {profile.archetype}
          </h1>

          {profile.tags && profile.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-1.5">
              {profile.tags.map((tag, i) => (
                <span
                  key={tag}
                  className="animate-in fade-in slide-in-from-bottom-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 duration-500 dark:bg-emerald-900/40 dark:text-emerald-300"
                  style={{ animationDelay: `${300 + i * 90}ms` }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4-card grid — matches the explore-card 2×2 from the home page */}
      {profile.profileCards && profile.profileCards.length > 0 && (
        <div className="grid w-full grid-cols-2 gap-3">
          {profile.profileCards.slice(0, 4).map((card, i) => (
            <div
              key={card.label}
              className={cn(
                "bg-card animate-in fade-in slide-in-from-bottom-1 rounded-2xl border p-4 shadow-sm duration-500",
              )}
              style={{ animationDelay: `${600 + i * 90}ms` }}
            >
              <p className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
                {card.label}
              </p>
              <p className="mt-1 text-sm font-semibold text-balance">
                {card.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {profile.profileSummary && (
        <div
          className="bg-card animate-in fade-in slide-in-from-bottom-1 w-full rounded-2xl border p-5 shadow-sm duration-500"
          style={{ animationDelay: "1000ms" }}
        >
          <p className="text-foreground text-sm leading-relaxed">
            {profile.profileSummary}
          </p>
        </div>
      )}

      <div
        className="animate-in fade-in flex w-full flex-col gap-2 pt-2 duration-500 sm:flex-row"
        style={{ animationDelay: "1200ms" }}
      >
        <Button asChild className="flex-1">
          <Link href="/">See my recommendations</Link>
        </Button>
        <Button variant="outline" asChild className="flex-1">
          <Link href="/profile/taste">View my taste profile</Link>
        </Button>
      </div>
    </div>
  );
}

function PulsingDot() {
  return (
    <div className="relative size-12">
      <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/40" />
      <div className="absolute inset-2 rounded-full bg-emerald-500" />
    </div>
  );
}
