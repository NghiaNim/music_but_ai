"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import type { RouterOutputs } from "@acme/api";

import { authClient } from "~/auth/client";
import { useTRPC } from "~/trpc/react";

type UserEventWithEvent = RouterOutputs["userEvent"]["myEvents"][number];

const BADGES = [
  {
    id: "beethoven",
    label: "Beethoven Lover",
    image: "/badges/badge_beethoven.png",
    achievement: "Attended 3 concerts featuring Beethoven pieces",
    composer: "Beethoven",
    required: 3,
  },
  {
    id: "mozart",
    label: "Mozart Lover",
    image: "/badges/badge_mozart.png",
    achievement: "Attended 3 concerts featuring Mozart pieces",
    composer: "Mozart",
    required: 3,
  },
  {
    id: "bach",
    label: "Bach Lover",
    image: "/badges/badge_bach_v2.png",
    achievement: "Attended 3 concerts featuring Bach pieces",
    composer: "Bach",
    required: 3,
  },
  {
    id: "chopin",
    label: "Chopin Lover",
    image: "/badges/badge_chopin.png",
    achievement: "Attended 3 concerts featuring Chopin pieces",
    composer: "Chopin",
    required: 3,
  },
  {
    id: "baroque",
    label: "Baroque Era Enthusiast",
    image: "/badges/badge_baroque.png",
    achievement: "Listened to 10 pieces written in the Baroque era",
  },
  {
    id: "romantic",
    label: "Romantic Era Enthusiast",
    image: "/badges/badge_romantic_v3.png",
    achievement: "Listened to 10 pieces written in the Romantic era",
  },
  {
    id: "classical",
    label: "Classical Era Enthusiast",
    image: "/badges/badge_classical_v3.png",
    achievement: "Listened to 10 pieces written in the Classical era",
  },
] as const;

function BadgeCard({
  badge,
  isFlipped,
  earned,
  onFlip,
}: {
  badge: (typeof BADGES)[number];
  isFlipped: boolean;
  earned: boolean;
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
      {!earned && (
        <p className="text-muted-foreground mt-1 text-center text-[10px] uppercase tracking-wide">
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
    if (badge.composer) {
      const count = composerCounts.get(badge.composer) ?? 0;
      return { ...badge, earned: count >= (badge.required ?? 3) };
    }
    return { ...badge, earned: false };
  });

  // Days on app: from user profile createdAt if available, otherwise from first attended event
  const profile = session?.user.profile as
    | { createdAt?: string | Date }
    | undefined;
  const createdAt =
    (profile?.createdAt && new Date(profile.createdAt)) ||
    (attended[0] ? new Date(attended[0].createdAt) : undefined);
  const daysOnApp =
    createdAt != null
      ? Math.max(
          1,
          Math.floor(
            (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24),
          ),
        )
      : 0;

  const [flippedIds, setFlippedIds] = useState<Set<string>>(new Set());

  const toggleFlip = (id: string) => {
    setFlippedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <>
      {/* Profile Card */}
      <div className="bg-card mt-5 rounded-2xl border p-6 shadow-sm">
        <div className="flex items-start gap-6">
          <div className="flex flex-col items-center">
            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-[#F8E8EE]">
              <span className="text-5xl">🎵</span>
            </div>
            <p className="text-foreground mt-3 text-xl font-bold">{name}</p>
          </div>

          <div className="flex flex-1 flex-col justify-center">
            <div className="py-2.5">
              <p className="text-foreground text-2xl font-bold">
                {concertsAttended}
              </p>
              <p className="text-muted-foreground text-xs">
                Concerts Attended
              </p>
            </div>
            <div className="bg-border h-px" />
            <div className="py-2.5">
              <p className="text-foreground text-2xl font-bold">
                {daysOnApp}
              </p>
              <p className="text-muted-foreground text-xs">Days on Classica</p>
            </div>
          </div>
        </div>
      </div>

      {/* My Tickets */}
      <Link
        href="/tickets"
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
        {(isSignedIn ? badgesWithState : BADGES.map((b) => ({ ...b, earned: false }))).map(
          (badge) => (
          <BadgeCard
            key={badge.id}
            badge={badge}
            isFlipped={flippedIds.has(badge.id)}
            earned={badge.earned}
            onFlip={() => toggleFlip(badge.id)}
          />
        ),
        )}
      </div>
    </>
  );
}
