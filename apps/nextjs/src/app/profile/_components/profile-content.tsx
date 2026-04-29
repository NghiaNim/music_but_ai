"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import type { RouterOutputs } from "@acme/api";

import { authClient } from "~/auth/client";
import {
  getCompletedSet,
  getStoredNumber,
  POINTS_KEY,
} from "~/app/learn/_lib/progress";
import { useTRPC } from "~/trpc/react";

type UserEventWithEvent = RouterOutputs["userEvent"]["myEvents"][number];

const BADGES = [
  {
    id: "beethoven",
    baseLabel: "Beethoven Lover",
    image: "/badges/badge_beethoven.png",
    category: "attended" as const,
    composer: "Beethoven",
  },
  {
    id: "mozart",
    baseLabel: "Mozart Lover",
    image: "/badges/badge_mozart.png",
    category: "attended" as const,
    composer: "Mozart",
  },
  {
    id: "bach",
    baseLabel: "Bach Lover",
    image: "/badges/badge_bach_v2.png",
    category: "attended" as const,
    composer: "Bach",
  },
  {
    id: "chopin",
    baseLabel: "Chopin Lover",
    image: "/badges/badge_chopin.png",
    category: "attended" as const,
    composer: "Chopin",
  },
  {
    id: "baroque",
    baseLabel: "Baroque Era Enthusiast",
    image: "/badges/badge_baroque.png",
    category: "listened" as const,
  },
  {
    id: "romantic",
    baseLabel: "Romantic Era Enthusiast",
    image: "/badges/badge_romantic_v3.png",
    category: "listened" as const,
  },
  {
    id: "classical",
    baseLabel: "Classical Era Enthusiast",
    image: "/badges/badge_classical_v3.png",
    category: "listened" as const,
  },
] as const;

type ComposerBadge = Extract<(typeof BADGES)[number], { composer: string }>;

function isComposerBadge(b: (typeof BADGES)[number]): b is ComposerBadge {
  return "composer" in b;
}

const BADGE_LEVELS = [
  { level: 1, numeral: "I", requirement: 3 },
  { level: 2, numeral: "II", requirement: 6 },
  { level: 3, numeral: "III", requirement: 9 },
] as const;

type BadgeLevel = (typeof BADGE_LEVELS)[number];

const LEARNING_LEVELS = [
  { min: 0, name: "Newcomer" },
  { min: 20, name: "Curious Listener" },
  { min: 50, name: "Music Explorer" },
  { min: 100, name: "Seasoned Ear" },
  { min: 160, name: "Music Connoisseur" },
] as const;

type LearningLevel = (typeof LEARNING_LEVELS)[number];

function getBadgeLevel(progress: number): BadgeLevel {
  let current: BadgeLevel = BADGE_LEVELS[0];
  for (const level of BADGE_LEVELS) {
    if (progress >= level.requirement) current = level;
  }
  return current;
}

function getLearningLevel(points: number) {
  let current: LearningLevel = LEARNING_LEVELS[0];
  for (const level of LEARNING_LEVELS) {
    if (points >= level.min) current = level;
  }
  const currentIndex = LEARNING_LEVELS.findIndex((l) => l.name === current.name);
  const next = LEARNING_LEVELS[currentIndex + 1];
  return { current, currentIndex, next };
}

function buildAchievementText(input: {
  badge: (typeof BADGES)[number];
  requirement: number;
}): string {
  if (input.badge.category === "attended") {
    const composerText = isComposerBadge(input.badge)
      ? `${input.badge.composer} pieces`
      : "featured pieces";
    return `Attend ${input.requirement} concerts featuring ${composerText}`;
  }

  const eraName = input.badge.baseLabel.replace(" Era Enthusiast", "");
  return `Listen to ${input.requirement} ${eraName} era pieces`;
}

function lockedRequirementText(input: {
  badge: (typeof BADGES)[number];
  nextLevel: BadgeLevel;
}): string {
  return `${buildAchievementText({
    badge: input.badge,
    requirement: input.nextLevel.requirement,
  })} to unlock Level ${input.nextLevel.numeral}.`;
}

function BadgeCard({
  badge,
  isFlipped,
  earned,
  levelNumeral,
  onFlip,
}: {
  badge: (typeof BADGES)[number] & { achievement: string; label: string };
  isFlipped: boolean;
  earned: boolean;
  levelNumeral: string;
  onFlip: () => void;
}) {
  return (
    <div
      className="bg-card flex cursor-pointer flex-col items-center rounded-2xl border px-4 pt-5 pb-4 shadow-sm"
      onClick={onFlip}
      style={{ perspective: "800px" }}
    >
      {/* 3D coin */}
      <div
        className="relative"
        style={{
          width: 116,
          height: 116,
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          transition: "transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Front face */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            borderRadius: "50%",
          }}
        >
          {/* Gold ring */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background:
                "conic-gradient(from 0deg, #DCBB7D, #E8D4A2, #C4A060, #E8D4A2, #DCBB7D, #D4B06A, #C4A060, #DCBB7D)",
              padding: 3,
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <Image
                src={badge.image}
                alt={badge.label}
                fill
                unoptimized
                className="object-cover"
              />
            </div>
          </div>

          {/* Subtle sheen */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 30%, transparent 70%, rgba(255,255,255,0.08) 100%)",
              pointerEvents: "none",
            }}
          />

          {/* Sparkle top-right */}
          <div
            style={{
              position: "absolute",
              top: 8,
              right: 12,
              width: 8,
              height: 8,
              background:
                "radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(220,187,125,0.4) 50%, transparent 70%)",
              borderRadius: "50%",
              pointerEvents: "none",
            }}
          />
          {/* Sparkle bottom-left */}
          <div
            style={{
              position: "absolute",
              bottom: 16,
              left: 10,
              width: 5,
              height: 5,
              background:
                "radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(220,187,125,0.3) 50%, transparent 70%)",
              borderRadius: "50%",
              pointerEvents: "none",
            }}
          />
        </div>

        {/* Back face */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            borderRadius: "50%",
            background: "#DCBB7D",
            boxShadow:
              "inset 0 0 20px rgba(255,255,255,0.15), inset 0 0 4px rgba(0,0,0,0.08)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            overflow: "hidden",
          }}
        >
          {/* Soft edge glow */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, transparent 55%, rgba(255,255,255,0.12) 80%, rgba(255,255,255,0.2) 100%)",
              pointerEvents: "none",
            }}
          />
          {/* Glare streak top-left */}
          <div
            style={{
              position: "absolute",
              top: 10,
              left: 14,
              width: 28,
              height: 6,
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.45), transparent)",
              borderRadius: 3,
              transform: "rotate(-40deg)",
              pointerEvents: "none",
            }}
          />
          {/* Glare dot top-right */}
          <div
            style={{
              position: "absolute",
              top: 18,
              right: 20,
              width: 6,
              height: 6,
              background:
                "radial-gradient(circle, rgba(255,255,255,0.5) 0%, transparent 70%)",
              borderRadius: "50%",
              pointerEvents: "none",
            }}
          />
          {/* Glare arc bottom */}
          <div
            style={{
              position: "absolute",
              bottom: 8,
              right: 24,
              width: 20,
              height: 4,
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
              borderRadius: 2,
              transform: "rotate(30deg)",
              pointerEvents: "none",
            }}
          />
          <p
            style={{
              color: "#4A3820",
              fontSize: 10,
              fontWeight: 700,
              textAlign: "center",
              lineHeight: "14px",
              position: "relative",
              margin: 0,
            }}
          >
            {badge.achievement}
          </p>
        </div>
      </div>

      {/* Label */}
      <p
        className="mt-3 text-center text-sm font-semibold"
        style={{
          color: earned ? "var(--foreground)" : "var(--muted-foreground)",
        }}
      >
        {badge.label}
      </p>
      <p className="text-muted-foreground mt-1 text-center text-[10px] tracking-[0.22em] uppercase">
        Level {levelNumeral}
      </p>
      {!earned && (
        <p className="text-muted-foreground mt-1 text-center text-[10px] tracking-wide uppercase">
          Locked
        </p>
      )}
    </div>
  );
}

export function ProfileContent() {
  const { data: session } = authClient.useSession();
  const name = session?.user.name ?? "Guest";
  const isSignedIn = !!session?.user;
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const trpc = useTRPC();
  const { data: userEvents } = useQuery({
    ...trpc.userEvent.myEvents.queryOptions(),
    enabled: isSignedIn,
  });

  const attended =
    userEvents?.filter((ue: UserEventWithEvent) => ue.status === "attended") ??
    [];

  const concertsAttended = attended.length;

  const composerCounts = new Map<string, number>();
  for (const ue of attended) {
    const composer = ue.event.program.split(":")[0]?.trim();
    if (!composer) continue;
    composerCounts.set(composer, (composerCounts.get(composer) ?? 0) + 1);
  }

  const badgesWithState = BADGES.map((badge) => {
    const progress = isComposerBadge(badge)
      ? (composerCounts.get(badge.composer) ?? 0)
      : 0;
    const currentLevel = getBadgeLevel(progress);
    const nextLevel =
      BADGE_LEVELS.find((level) => level.level === currentLevel.level + 1) ??
      currentLevel;

    return {
      ...badge,
      progress,
      currentLevel,
      nextLevel,
      earned: progress >= currentLevel.requirement,
      label: `${badge.baseLabel} ${currentLevel.numeral}`,
      achievement: buildAchievementText({
        badge,
        requirement: currentLevel.requirement,
      }),
    };
  });

  // Days on app: from user profile createdAt if available, otherwise from first attended event
  const userWithProfile = session?.user as
    | { profile?: { createdAt?: string | Date } }
    | undefined;
  const createdAtFromProfile = userWithProfile?.profile?.createdAt
    ? new Date(userWithProfile.profile.createdAt)
    : undefined;
  const createdAt =
    createdAtFromProfile ??
    (attended[0] ? new Date(attended[0].createdAt) : undefined);

  const [asOf] = useState(() => new Date());
  const [learningPoints] = useState(() =>
    typeof window === "undefined" ? 0 : getStoredNumber(POINTS_KEY),
  );
  const [completedQuizzes] = useState(() =>
    typeof window === "undefined" ? 0 : getCompletedSet().size,
  );
  const daysOnApp =
    createdAt != null
      ? Math.max(
          1,
          Math.floor(
            (asOf.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24),
          ),
        )
      : 0;
  const { current: learningLevel, currentIndex: learningLevelIndex, next: nextLearningLevel } =
    getLearningLevel(learningPoints);
  const learningLevelNumber = learningLevelIndex + 1;
  const levelStart = learningLevel.min;
  const levelEnd = nextLearningLevel?.min ?? levelStart;
  const xpIntoLevel = learningPoints - levelStart;
  const xpForNext = nextLearningLevel ? levelEnd - levelStart : 0;
  const levelProgressPercent = nextLearningLevel
    ? Math.max(0, Math.min(100, Math.round((xpIntoLevel / xpForNext) * 100)))
    : 100;

  const quests = [
    {
      id: "concert-streak",
      icon: "🎟️",
      title: "Concert Explorer",
      subtitle: "Attend concerts to sharpen your profile",
      progress: concertsAttended,
      target: 1,
      reward: 30,
      href: "/events",
      cta: "Find concerts",
    },
    {
      id: "quiz-master",
      icon: "🧠",
      title: "Quiz Collector",
      subtitle: "Complete Learn quizzes to earn XP",
      progress: completedQuizzes,
      target: 5,
      reward: 25,
      href: "/learn",
      cta: "Continue learning",
    },
  ] as const;

  const [newlyEarnedBadgeId, setNewlyEarnedBadgeId] = useState<string | null>(
    null,
  );
  const [previewBadgeId, setPreviewBadgeId] = useState<string | null>(null);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isPhotoSheetOpen, setIsPhotoSheetOpen] = useState(false);
  const [overlayFlipped, setOverlayFlipped] = useState(false);
  const overlayBadgeId = newlyEarnedBadgeId ?? previewBadgeId;

  const newlyEarnedBadge = useMemo(
    () => badgesWithState.find((b) => b.id === overlayBadgeId) ?? null,
    [badgesWithState, overlayBadgeId],
  );
  const overlayBadgeIsUnlocked = newlyEarnedBadge?.earned ?? false;

  useEffect(() => {
    if (session === null) return;
    const userId = session.user.id;

    const storageKey = `classica-earned-badges:${userId}`;
    const earnedNow = badgesWithState.filter((b) => b.earned).map((b) => b.id);
    window.localStorage.setItem(storageKey, JSON.stringify(earnedNow));
  }, [badgesWithState, session]);

  useEffect(() => {
    if (!overlayBadgeId) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [overlayBadgeId]);

  useEffect(() => {
    if (!session?.user.id) return;
    const key = `classica-profile-photo:${session.user.id}`;
    const stored = window.localStorage.getItem(key);
    setPhotoUrl(stored);
  }, [session?.user.id]);

  function handlePhotoPick() {
    fileInputRef.current?.click();
  }

  function handleRemovePhoto() {
    if (!session?.user.id) return;
    const key = `classica-profile-photo:${session.user.id}`;
    window.localStorage.removeItem(key);
    setPhotoUrl(null);
    setPhotoError(null);
    setIsPhotoSheetOpen(false);
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !session?.user.id) return;

    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      setPhotoError("Please upload an image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setPhotoError("Image is too large. Use 2MB or smaller.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const next = typeof reader.result === "string" ? reader.result : null;
      if (!next) {
        setPhotoError("Could not read that image.");
        return;
      }
      const key = `classica-profile-photo:${session.user.id}`;
      window.localStorage.setItem(key, next);
      setPhotoUrl(next);
      setPhotoError(null);
      setIsPhotoSheetOpen(false);
    };
    reader.readAsDataURL(file);
  }

  async function handleShareBadge() {
    if (!newlyEarnedBadge) return;
    const shareText = `I just earned the "${newlyEarnedBadge.label}" badge on Classica!`;
    const shareUrl =
      typeof window !== "undefined" ? window.location.origin : "";

    try {
      if (typeof navigator.share === "function") {
        await navigator.share({
          title: "New Classica badge unlocked",
          text: shareText,
          url: shareUrl,
        });
        setShareFeedback("Shared!");
        return;
      }
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`.trim());
      setShareFeedback("Copied share text to clipboard.");
    } catch {
      setShareFeedback("Could not share right now.");
    }
  }

  const openBadgeOverlay = (badgeId: string) => {
    setPreviewBadgeId(badgeId);
    setOverlayFlipped(false);
    setShareFeedback(null);
  };
  const closeBadgeOverlay = () => {
    setNewlyEarnedBadgeId(null);
    setPreviewBadgeId(null);
    setOverlayFlipped(false);
  };

  return (
    <>
      {/* Profile Card */}
      <div className="bg-card mt-5 rounded-2xl border p-6 shadow-sm">
        <div className="flex items-start gap-6">
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={() => setIsPhotoSheetOpen(true)}
              className="relative flex h-28 w-28 items-center justify-center overflow-visible rounded-full bg-[#F8E8EE] ring-1 ring-black/5"
              aria-label="Open profile photo options"
            >
              <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full">
                {photoUrl ? (
                  <Image
                    src={photoUrl}
                    alt={`${name} profile photo`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="text-5xl">🎵</span>
                )}
              </div>
              <div className="bg-card/95 absolute right-0 bottom-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide shadow-sm backdrop-blur">
                LV {learningLevelNumber}
              </div>
            </button>
            <p className="text-foreground mt-3 text-xl font-bold">{name}</p>
            <p className="text-muted-foreground mt-1 text-[11px]">
              {learningLevel.name}
            </p>
            {photoError ? (
              <p className="mt-1 text-center text-[10px] text-rose-500">
                {photoError}
              </p>
            ) : null}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>

          <div className="grid w-full flex-1 grid-cols-2 gap-3">
            <div className="bg-muted/35 flex min-h-[86px] flex-col justify-between rounded-2xl border p-3">
              <p className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-medium">
                <span
                  aria-hidden
                  className="bg-background inline-flex size-6 items-center justify-center rounded-full border text-sm"
                >
                  🎵
                </span>
                Concerts attended
              </p>
              <p className="text-foreground text-2xl leading-none font-bold">
                {concertsAttended}
              </p>
            </div>
            <div className="bg-muted/35 flex min-h-[86px] flex-col justify-between rounded-2xl border p-3">
              <p className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-medium">
                <span
                  aria-hidden
                  className="bg-background inline-flex size-6 items-center justify-center rounded-full border text-sm"
                >
                  🔥
                </span>
                Streak
              </p>
              <p className="text-foreground text-2xl leading-none font-bold">
                {daysOnApp}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl border bg-linear-to-r from-amber-50/70 via-orange-50/70 to-rose-50/70 p-3 dark:from-amber-900/20 dark:via-orange-900/20 dark:to-rose-900/20">
          <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px]">
            <span className="flex items-center gap-1.5 font-semibold">
              <span aria-hidden>✨</span>
              {`LV ${learningLevelNumber}`}
            </span>
            <span className="text-muted-foreground tabular-nums">
              {nextLearningLevel
                ? `${xpIntoLevel}/${xpForNext} XP`
                : `${learningPoints} XP`}
            </span>
          </div>
          <div className="bg-background/70 h-2.5 w-full overflow-hidden rounded-full border">
            <div
              className="h-full rounded-full bg-linear-to-r from-amber-400 via-orange-500 to-rose-500 transition-all"
              style={{ width: `${levelProgressPercent}%` }}
            />
          </div>
          <p className="text-muted-foreground mt-1.5 text-[10px]">
            {nextLearningLevel
              ? `${Math.max(0, xpForNext - xpIntoLevel)} XP left to level up to LV ${learningLevelNumber + 1} ${nextLearningLevel.name}`
              : "You have unlocked every learning level."}
          </p>
        </div>

        <div className="bg-border mt-5 h-px" />

        <div className="mt-5">
          <h2 className="text-foreground flex items-center gap-2 text-base font-bold">
            <span
              aria-hidden
              className="bg-muted inline-flex size-6 items-center justify-center rounded-full border text-xs"
            >
              🎯
            </span>
            Daily quests
          </h2>
          <p className="text-muted-foreground mt-1 text-xs">
            Complete these daily quests to earn points and level up.
          </p>
          <div className="mt-3 space-y-2.5">
            {quests.map((quest) => {
              const clamped = Math.min(quest.progress, quest.target);
              const percent = Math.round((clamped / quest.target) * 100);
              const complete = quest.progress >= quest.target;
              return (
                <Link
                  key={quest.id}
                  href={quest.href}
                  className="bg-muted/40 hover:bg-muted/60 block rounded-xl border p-3 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span
                        aria-hidden
                        className="bg-background inline-flex size-7 shrink-0 items-center justify-center rounded-full border text-sm"
                      >
                        {quest.icon}
                      </span>
                      <div>
                      <p className="text-sm font-semibold">{quest.title}</p>
                      <p className="text-muted-foreground text-[11px]">
                        {quest.subtitle}
                      </p>
                      </div>
                    </div>
                    <span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide">
                      +{quest.reward} XP
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">
                      {clamped}/{quest.target} complete
                    </span>
                    <span className="font-medium">
                      {complete ? "Completed" : quest.cta}
                    </span>
                  </div>
                  <div className="bg-background mt-1.5 h-1.5 w-full overflow-hidden rounded-full">
                    <div
                      className="h-full rounded-full bg-linear-to-r from-emerald-400 to-emerald-600 transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {isPhotoSheetOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4">
          <div className="bg-card w-full max-w-[430px] rounded-2xl border p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Profile photo</p>
              <button
                type="button"
                onClick={() => setIsPhotoSheetOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                Close
              </button>
            </div>
            <div className="mt-3 flex justify-center">
              <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-[#F8E8EE]">
                {photoUrl ? (
                  <Image
                    src={photoUrl}
                    alt={`${name} profile photo preview`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="text-5xl">🎵</span>
                )}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handlePhotoPick}
                className="bg-muted/40 hover:bg-muted/60 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors"
              >
                {photoUrl ? "Change photo" : "Upload photo"}
              </button>
              <button
                type="button"
                onClick={handleRemovePhoto}
                disabled={!photoUrl}
                className="rounded-xl border px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                Remove photo
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Your Taste */}
      <Link
        href="/profile/taste"
        className="bg-card hover:bg-muted/50 mt-5 flex items-center gap-3 rounded-2xl border p-4 shadow-sm transition-colors"
      >
        <div className="flex size-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
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
            <path d="M2 13a2 2 0 0 0 2-2V7a2 2 0 0 1 4 0v13a2 2 0 0 0 4 0V4a2 2 0 0 1 4 0v13a2 2 0 0 0 4 0v-4a2 2 0 0 1 2-2" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="font-semibold">Your taste</p>
          <p className="text-muted-foreground text-xs">
            Your archetype, dimensions, and how we read your sound
          </p>
        </div>
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
      </Link>

      {/* My Tickets */}
      <Link
        href="/tickets"
        className="bg-card hover:bg-muted/50 mt-3 flex items-center gap-3 rounded-2xl border p-4 shadow-sm transition-colors"
      >
        <div className="flex size-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
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
            <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
            <path d="M13 5v2" />
            <path d="M13 17v2" />
            <path d="M13 11v2" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="font-semibold">My Tickets</p>
          <p className="text-muted-foreground text-xs">
            View your purchased tickets
          </p>
        </div>
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
      </Link>

      {/* Badges Section */}
      <h2 className="text-foreground mt-8 mb-4 text-xl font-bold">Badges</h2>
      <p className="text-muted-foreground -mt-3 mb-4 text-xs">
        Tap a badge to flip it{isSignedIn ? "" : " — sign in to start earning"}
      </p>
      <div className="grid grid-cols-2 gap-3.5">
        {badgesWithState.map((badge) => (
          <BadgeCard
            key={badge.id}
            badge={badge}
            isFlipped={false}
            earned={badge.earned}
            levelNumeral={badge.currentLevel.numeral}
            onFlip={() => openBadgeOverlay(badge.id)}
          />
        ))}
      </div>

      {newlyEarnedBadge && (
        <div className="fixed inset-0 z-[60] backdrop-blur-md">
          <div className="absolute inset-0 bg-black/55" />
          <div className="relative mx-auto flex h-full w-full max-w-[430px] flex-col items-center justify-center px-6 text-center text-white">
            <button
              type="button"
              onClick={closeBadgeOverlay}
              className="absolute top-40 right-4 flex size-10 items-center justify-center rounded-full border border-white/25 bg-black/25 text-xl leading-none text-white transition-colors hover:bg-white/15"
              aria-label="Close badge overlay"
            >
              ×
            </button>
            <button
              type="button"
              onClick={() => {
                if (!overlayBadgeIsUnlocked) return;
                setOverlayFlipped((v) => !v);
              }}
              className="relative mb-4"
              style={
                overlayBadgeIsUnlocked
                  ? { animation: "badgeTurnAround 1.2s ease-in-out" }
                  : undefined
              }
            >
              <div
                className="relative size-36"
                style={{
                  transformStyle: "preserve-3d",
                  transform: overlayFlipped
                    ? "rotateY(180deg)"
                    : "rotateY(0deg)",
                  transition: "transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                <div
                  className="absolute inset-0 overflow-hidden rounded-full border-4 border-amber-300 bg-zinc-900 shadow-[0_0_40px_rgba(245,158,11,0.45)]"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <Image
                    src={newlyEarnedBadge.image}
                    alt={newlyEarnedBadge.label}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div
                  className="absolute inset-0 flex items-center justify-center rounded-full border-4 border-amber-300 bg-[#DCBB7D] p-6"
                  style={{
                    transform: "rotateY(180deg)",
                    backfaceVisibility: "hidden",
                  }}
                >
                  <p className="text-center text-xs leading-5 font-semibold text-[#4A3820]">
                    {overlayBadgeIsUnlocked
                      ? newlyEarnedBadge.achievement
                      : lockedRequirementText({
                          badge: newlyEarnedBadge,
                          nextLevel: newlyEarnedBadge.currentLevel,
                        })}
                  </p>
                </div>
              </div>
            </button>
            <p className="text-xs font-semibold tracking-[0.2em] text-amber-300 uppercase">
              {overlayBadgeIsUnlocked ? "New Badge Unlocked" : "Badge Locked"}
            </p>
            <h3 className="mt-2 text-3xl font-bold">
              {newlyEarnedBadge.label}
            </h3>
            <p className="mt-2 max-w-sm text-sm text-zinc-200">
              {overlayBadgeIsUnlocked
                ? newlyEarnedBadge.achievement
                : lockedRequirementText({
                    badge: newlyEarnedBadge,
                    nextLevel: newlyEarnedBadge.currentLevel,
                  })}
            </p>
            {overlayBadgeIsUnlocked ? (
              <p className="mt-2 text-xs text-zinc-300">Tap badge to flip</p>
            ) : null}

            <div className="mt-8 w-full max-w-sm space-y-2">
              {overlayBadgeIsUnlocked ? (
                <button
                  onClick={handleShareBadge}
                  className="w-full rounded-xl bg-[#9C1738] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#7c1030]"
                >
                  Share Badge
                </button>
              ) : null}
            </div>
            {shareFeedback && (
              <p className="mt-3 text-xs text-zinc-300">{shareFeedback}</p>
            )}
          </div>
        </div>
      )}
      <style jsx global>{`
        @keyframes badgeTurnAround {
          0% {
            transform: rotateY(0deg);
          }
          100% {
            transform: rotateY(360deg);
          }
        }
      `}</style>
    </>
  );
}
