"use client";

import Image from "next/image";
import { useSuspenseQuery } from "@tanstack/react-query";

import type { RouterOutputs } from "@acme/api";

import { useTRPC } from "~/trpc/react";

type LiveEventItem = RouterOutputs["liveEvent"]["all"][number];

const SOURCE_LABELS: Record<string, string> = {
  msm: "Manhattan School of Music",
  carnegie_hall: "Carnegie Hall",
  met_opera: "Metropolitan Opera",
  juilliard: "Juilliard",
};

export function LiveEventFeed() {
  const trpc = useTRPC();
  const { data: liveEvents } = useSuspenseQuery(
    trpc.liveEvent.all.queryOptions({ upcomingOnly: true }),
  );

  if (liveEvents.length === 0) {
    return null;
  }

  return (
    <section className="mb-8">
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="text-base font-semibold">From NYC conservatories</h2>
        <span className="text-muted-foreground text-[11px]">
          Refreshed daily
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {liveEvents.map((ev) => (
          <LiveEventCard key={ev.id} event={ev} />
        ))}
      </div>
    </section>
  );
}

function LiveEventCard({ event }: { event: LiveEventItem }) {
  const sourceLabel = SOURCE_LABELS[event.source] ?? event.source;
  return (
    <a
      href={event.eventUrl}
      target="_blank"
      rel="noreferrer"
      className="bg-card hover:bg-muted/40 flex gap-3 rounded-xl border p-3 transition-colors"
    >
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg">
        {event.imageUrl ? (
          <Image
            src={event.imageUrl}
            alt={event.title}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-sky-200 to-indigo-100 text-xs font-semibold text-sky-700 dark:from-sky-900/50 dark:to-indigo-800/30 dark:text-sky-200">
            Live
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap gap-1">
          <span className="bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-200 rounded-full px-2 py-0.5 text-[10px] font-medium">
            {sourceLabel}
          </span>
        </div>
        <h3 className="line-clamp-2 text-sm font-semibold">{event.title}</h3>
        <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">
          {event.dateText ?? ""}
          {event.venueName ? ` · ${event.venueName}` : ""}
        </p>
      </div>
    </a>
  );
}

export function LiveEventFeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="mb-8 flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card flex gap-3 rounded-xl border p-3">
          <div className="bg-muted h-20 w-20 animate-pulse rounded-lg" />
          <div className="flex-1 space-y-2 py-1">
            <div className="bg-muted h-4 w-28 animate-pulse rounded-full" />
            <div className="bg-muted h-4 w-3/4 animate-pulse rounded" />
            <div className="bg-muted h-3 w-1/2 animate-pulse rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
