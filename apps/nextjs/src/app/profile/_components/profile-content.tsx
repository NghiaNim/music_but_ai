"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const STATS = [
  { value: "24", label: "Concerts Attended" },
  { value: "142", label: "Days on the App" },
  { value: "1,280", label: "Live Pieces Listened" },
];

const BADGES = [
  {
    id: "beethoven",
    label: "Beethoven Lover",
    image: "/badges/badge_beethoven.png",
    dateEarned: "Jan 12, 2026",
    achievement: "Attended 3 concerts featuring Beethoven pieces",
  },
  {
    id: "mozart",
    label: "Mozart Lover",
    image: "/badges/badge_mozart.png",
    dateEarned: "Feb 3, 2026",
    achievement: "Attended 3 concerts featuring Mozart pieces",
  },
  {
    id: "bach",
    label: "Bach Lover",
    image: "/badges/badge_bach_v2.png",
    dateEarned: "Feb 18, 2026",
    achievement: "Attended 3 concerts featuring Bach pieces",
  },
  {
    id: "chopin",
    label: "Chopin Lover",
    image: "/badges/badge_chopin.png",
    dateEarned: "Dec 5, 2025",
    achievement: "Attended 3 concerts featuring Chopin pieces",
  },
  {
    id: "baroque",
    label: "Baroque Era Enthusiast",
    image: "/badges/badge_baroque.png",
    dateEarned: "Nov 20, 2025",
    achievement: "Listened to 10 pieces written in the Baroque era",
  },
  {
    id: "romantic",
    label: "Romantic Era Enthusiast",
    image: "/badges/badge_romantic_v3.png",
    dateEarned: "Jan 28, 2026",
    achievement: "Listened to 10 pieces written in the Romantic era",
  },
  {
    id: "classical",
    label: "Classical Era Enthusiast",
    image: "/badges/badge_classical_v3.png",
    dateEarned: "Feb 10, 2026",
    achievement: "Listened to 10 pieces written in the Classical era",
  },
];

function BadgeCard({
  badge,
  isFlipped,
  onFlip,
}: {
  badge: (typeof BADGES)[number];
  isFlipped: boolean;
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
          <div
            style={{
              width: 30,
              height: 1,
              backgroundColor: "#A8894D",
              margin: "6px 0",
              borderRadius: 1,
              position: "relative",
            }}
          />
          <p
            style={{
              color: "#5C4428",
              fontSize: 9,
              fontWeight: 600,
              textAlign: "center",
              position: "relative",
              margin: 0,
            }}
          >
            {badge.dateEarned}
          </p>
        </div>
      </div>

      {/* Label */}
      <p className="text-foreground mt-3 text-center text-sm font-semibold">
        {badge.label}
      </p>
    </div>
  );
}

export function ProfileContent() {
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
            <p className="text-foreground mt-3 text-xl font-bold">Billy</p>
          </div>

          <div className="flex flex-1 flex-col justify-center">
            {STATS.map((stat, index) => (
              <div key={stat.label}>
                <div className="py-2.5">
                  <p className="text-foreground text-2xl font-bold">
                    {stat.value}
                  </p>
                  <p className="text-muted-foreground text-xs">{stat.label}</p>
                </div>
                {index < STATS.length - 1 && <div className="bg-border h-px" />}
              </div>
            ))}
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
        Tap a badge to flip it
      </p>
      <div className="grid grid-cols-2 gap-3.5">
        {BADGES.map((badge) => (
          <BadgeCard
            key={badge.id}
            badge={badge}
            isFlipped={flippedIds.has(badge.id)}
            onFlip={() => toggleFlip(badge.id)}
          />
        ))}
      </div>
    </>
  );
}
