"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSuspenseQuery } from "@tanstack/react-query";

import type { RouterOutputs } from "@acme/api";
import { cn } from "@acme/ui";
import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";

import { useTRPC } from "~/trpc/react";

type EventItem = RouterOutputs["event"]["all"][number];

const GENRE_LABELS: Record<string, string> = {
  orchestral: "Orchestral",
  opera: "Opera",
  chamber: "Chamber",
  solo_recital: "Solo Recital",
  choral: "Choral",
  ballet: "Ballet",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  intermediate:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  advanced:
    "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
};

const GENRE_OPTIONS = [
  "orchestral",
  "opera",
  "chamber",
  "solo_recital",
  "choral",
  "ballet",
] as const;

const CITY_OPTIONS = [
  "New York",
  "Boston",
  "Chicago",
  "San Francisco",
  "Los Angeles",
  "Philadelphia",
  "Washington D.C.",
  "London",
  "Vienna",
  "Berlin",
] as const;

export function FeaturedEvents() {
  const trpc = useTRPC();
  const { data: events } = useSuspenseQuery(
    trpc.event.all.queryOptions({}),
  );

  const featured = events.slice(0, 4);

  if (featured.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        No events yet
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {featured.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}

export function EventFeed() {
  const trpc = useTRPC();
  const searchParams = useSearchParams();
  const initialDifficulty = searchParams.get("difficulty") ?? undefined;

  const [search, setSearch] = useState("");
  const [genreFilter, setGenreFilter] = useState<string | undefined>();
  const [difficultyFilter, setDifficultyFilter] = useState<
    string | undefined
  >(initialDifficulty);
  const [cityFilter, setCityFilter] = useState<string | undefined>();

  const { data: events } = useSuspenseQuery(
    trpc.event.all.queryOptions({
      search: search || undefined,
      genre: genreFilter as (typeof GENRE_OPTIONS)[number] | undefined,
      difficulty: difficultyFilter as
        | "beginner"
        | "intermediate"
        | "advanced"
        | undefined,
    }),
  );

  const filteredEvents = cityFilter
    ? events.filter(
        (e) =>
          e.venue.toLowerCase().includes(cityFilter.toLowerCase()) ||
          (e.venueAddress?.toLowerCase().includes(cityFilter.toLowerCase()) ??
            false),
      )
    : events;

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <Input
          placeholder="Search events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <select
          value={cityFilter ?? ""}
          onChange={(e) => setCityFilter(e.target.value || undefined)}
          className="bg-card text-foreground h-9 rounded-md border px-3 text-sm"
        >
          <option value="">All Cities</option>
          {CITY_OPTIONS.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        <FilterChip
          label="All"
          active={!genreFilter}
          onClick={() => setGenreFilter(undefined)}
        />
        {GENRE_OPTIONS.map((g) => (
          <FilterChip
            key={g}
            label={GENRE_LABELS[g] ?? g}
            active={genreFilter === g}
            onClick={() => setGenreFilter(genreFilter === g ? undefined : g)}
          />
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        <FilterChip
          label="All Levels"
          active={!difficultyFilter}
          onClick={() => setDifficultyFilter(undefined)}
        />
        {(["beginner", "intermediate", "advanced"] as const).map((d) => (
          <FilterChip
            key={d}
            label={d.charAt(0).toUpperCase() + d.slice(1)}
            active={difficultyFilter === d}
            onClick={() =>
              setDifficultyFilter(difficultyFilter === d ? undefined : d)
            }
          />
        ))}
      </div>

      {filteredEvents.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16">
          <p className="text-muted-foreground text-sm">No events found</p>
          <p className="text-muted-foreground text-xs">
            Try adjusting your filters
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}

function EventCard({ event }: { event: EventItem }) {
  const date = new Date(event.date);
  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const formattedTime = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <Link href={`/event/${event.id}`}>
      <div className="bg-card flex gap-3 rounded-xl border p-3 transition-colors active:bg-muted/50">
        <div className="bg-primary/5 flex w-14 shrink-0 flex-col items-center justify-center rounded-lg py-2">
          <span className="text-primary text-[10px] font-semibold uppercase">
            {date.toLocaleDateString("en-US", { month: "short" })}
          </span>
          <span className="text-primary text-lg font-bold leading-none">
            {date.getDate()}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap gap-1">
            <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[10px] font-medium">
              {GENRE_LABELS[event.genre] ?? event.genre}
            </span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-medium",
                DIFFICULTY_COLORS[event.difficulty],
              )}
            >
              {event.difficulty === "beginner"
                ? "Beginner Friendly"
                : event.difficulty.charAt(0).toUpperCase() +
                  event.difficulty.slice(1)}
            </span>
          </div>
          <h3 className="line-clamp-1 text-sm font-semibold">
            {event.title}
          </h3>
          <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">
            {formattedTime} &middot; {event.venue}
          </p>
        </div>
      </div>
    </Link>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      variant={active ? "default" : "outline"}
      size="sm"
      onClick={onClick}
      className="h-7 rounded-full text-[11px]"
    >
      {label}
    </Button>
  );
}

export function EventFeedSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-card flex h-20 gap-3 rounded-xl border p-3"
        >
          <div className="bg-muted h-full w-14 animate-pulse rounded-lg" />
          <div className="flex-1 space-y-2 py-1">
            <div className="flex gap-1">
              <div className="bg-muted h-4 w-16 animate-pulse rounded-full" />
              <div className="bg-muted h-4 w-20 animate-pulse rounded-full" />
            </div>
            <div className="bg-muted h-4 w-3/4 animate-pulse rounded" />
            <div className="bg-muted h-3 w-1/2 animate-pulse rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
