"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { cn } from "@acme/ui";
import { Button } from "@acme/ui/button";

interface ProfileShape {
  archetype: string | null;
  badgeEmoji: string | null;
  tags: string[] | null;
  profileSummary: string | null;
}

interface MinimalRevealProps {
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
 * Lightweight reveal — Step 7 will replace this with the full
 * animated badge + 4 cards + edit affordances. For Step 5 we just
 * need *something* good enough that the visual-cards loop ships
 * end-to-end and the user sees their archetype.
 */
export function MinimalReveal({ profile, isLoading }: MinimalRevealProps) {
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
        <div className="flex flex-col items-center gap-2">
          <PulsingDot />
          <p
            key={messageIndex}
            className="text-muted-foreground animate-in fade-in text-sm duration-500"
          >
            {LOADING_MESSAGES[messageIndex]}…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 py-8 text-center">
      <div className="animate-in fade-in zoom-in-95 text-7xl duration-700">
        {profile.badgeEmoji ?? "♪"}
      </div>
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
          You are a
        </p>
        <h1 className="animate-in fade-in slide-in-from-bottom-2 text-3xl font-semibold text-balance duration-700 md:text-4xl">
          {profile.archetype}
        </h1>
      </div>

      {profile.tags && profile.tags.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {profile.tags.map((tag, i) => (
            <span
              key={tag}
              className={cn(
                "animate-in fade-in slide-in-from-bottom-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800 duration-500 dark:bg-emerald-950/40 dark:text-emerald-300",
              )}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {profile.profileSummary && (
        <p className="text-muted-foreground max-w-md text-balance">
          {profile.profileSummary}
        </p>
      )}

      <div className="flex flex-col gap-2 pt-4 sm:flex-row">
        <Button asChild>
          <Link href="/">See my recommendations</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/profile">Edit my profile</Link>
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
