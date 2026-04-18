"use client";

import { useState } from "react";
import Image from "next/image";
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
  jazz: "Jazz",
};

const LISTING_LABELS: Record<string, string> = {
  local: "Local",
  concert: "Concert",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  intermediate:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  advanced: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
};

const GENRE_OPTIONS = [
  "orchestral",
  "opera",
  "chamber",
  "solo_recital",
  "choral",
  "ballet",
  "jazz",
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
  const { data: events } = useSuspenseQuery(trpc.event.all.queryOptions({}));

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
  const [difficultyFilter, setDifficultyFilter] = useState<string | undefined>(
    initialDifficulty,
  );
  const [cityFilter, setCityFilter] = useState<string | undefined>();
  const [ticketedFilter, setTicketedFilter] = useState<
    "ticketed" | "non_ticketed" | undefined
  >();
  const [listingFilter, setListingFilter] = useState<
    "local" | "concert" | undefined
  >();
  const [sortBy, setSortBy] = useState<"day_asc" | "day_desc">("day_asc");

  const { data: events } = useSuspenseQuery(
    trpc.event.all.queryOptions({
      search: search || undefined,
      genre: genreFilter as (typeof GENRE_OPTIONS)[number] | undefined,
      difficulty: difficultyFilter as
        | "beginner"
        | "intermediate"
        | "advanced"
        | undefined,
      listingCategory: listingFilter,
    }),
  );

  const filteredEvents = events.filter((e) => {
    if (cityFilter) {
      const matchesCity =
        e.venue.toLowerCase().includes(cityFilter.toLowerCase()) ||
        (e.venueAddress?.toLowerCase().includes(cityFilter.toLowerCase()) ??
          false);
      if (!matchesCity) return false;
    }
    if (ticketedFilter === "ticketed" && !e.ticketUrl) return false;
    if (ticketedFilter === "non_ticketed" && e.ticketUrl) return false;
    return true;
  });
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
    return sortBy === "day_asc" ? diff : -diff;
  });

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <SearchIcon />
          <Input
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border-zinc-300 bg-white pl-9 text-sm text-zinc-900 placeholder:text-zinc-900 md:text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-100"
          />
        </div>
        <select
          value={cityFilter ?? ""}
          onChange={(e) => setCityFilter(e.target.value || undefined)}
          className="h-9 w-[88px] rounded-md border border-zinc-300 bg-white px-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        >
          <option value="">All Cities</option>
          {CITY_OPTIONS.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "day_asc" | "day_desc")}
          className="h-9 w-[80px] rounded-md border border-zinc-300 bg-white px-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        >
          <option value="day_asc">By Date</option>
          <option value="day_desc">Latest Day</option>
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

      <div className="mb-3 flex flex-wrap gap-1.5">
        <FilterChip
          label="All listings"
          active={!listingFilter}
          onClick={() => setListingFilter(undefined)}
        />
        <FilterChip
          label="Local"
          active={listingFilter === "local"}
          onClick={() =>
            setListingFilter(listingFilter === "local" ? undefined : "local")
          }
        />
        <FilterChip
          label="Concerts"
          active={listingFilter === "concert"}
          onClick={() =>
            setListingFilter(
              listingFilter === "concert" ? undefined : "concert",
            )
          }
        />
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
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

      <div className="mb-4 flex flex-wrap gap-1.5">
        <FilterChip
          label="All Ticketing Types"
          active={!ticketedFilter}
          onClick={() => setTicketedFilter(undefined)}
        />
        <FilterChip
          label="Ticketed"
          active={ticketedFilter === "ticketed"}
          onClick={() =>
            setTicketedFilter(
              ticketedFilter === "ticketed" ? undefined : "ticketed",
            )
          }
        />
        <FilterChip
          label="Non-Ticketed"
          active={ticketedFilter === "non_ticketed"}
          onClick={() =>
            setTicketedFilter(
              ticketedFilter === "non_ticketed" ? undefined : "non_ticketed",
            )
          }
        />
      </div>

      {sortedEvents.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16">
          <p className="text-muted-foreground text-sm">No events found</p>
          <p className="text-muted-foreground text-xs">
            Try adjusting your filters
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sortedEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}

function formatFriendlyDate(date: Date): { badge: string; line: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eventDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const diffDays = Math.round(
    (eventDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
  const monthDay = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  if (diffDays === 0) return { badge: "Today", line: `Today at ${time}` };
  if (diffDays === 1) return { badge: "Tomorrow", line: `Tomorrow at ${time}` };
  if (diffDays > 1 && diffDays <= 6)
    return { badge: `This ${weekday}`, line: `This ${weekday} at ${time}` };
  return { badge: monthDay, line: `${weekday}, ${monthDay} · ${time}` };
}

function EventCard({ event }: { event: EventItem }) {
  const date = new Date(event.date);
  const { line } = formatFriendlyDate(date);

  return (
    <Link href={`/event/${event.id}`}>
      <div className="bg-card active:bg-muted/50 flex gap-3 rounded-xl border p-3 transition-colors">
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
            <div className="flex h-full w-full flex-col items-center justify-center bg-linear-to-br from-orange-200 to-amber-100 dark:from-orange-900/50 dark:to-amber-800/30">
              <span className="text-[10px] font-semibold text-orange-600 uppercase dark:text-orange-300">
                {date.toLocaleDateString("en-US", { month: "short" })}
              </span>
              <span className="text-xl leading-none font-bold text-orange-700 dark:text-orange-200">
                {date.getDate()}
              </span>
              <span className="mt-0.5 text-[9px] font-medium text-orange-500 dark:text-orange-400">
                {date.toLocaleDateString("en-US", { weekday: "short" })}
              </span>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap gap-1">
            <span className="bg-muted text-foreground rounded-full px-2 py-0.5 text-[10px] font-medium">
              {LISTING_LABELS[event.listingCategory] ?? event.listingCategory}
            </span>
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
          <h3 className="line-clamp-1 text-sm font-semibold" style={{ color: "#9C1738" }}>{event.title}</h3>
          <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">
            {line} &middot; {event.venue}
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
      className={cn(
        "h-7 rounded-full border text-[11px]",
        active && "border-transparent",
      )}
    >
      {label}
    </Button>
  );
}

function SearchIcon() {
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
      className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export function EventFeedSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card flex gap-3 rounded-xl border p-3">
          <div className="bg-muted h-20 w-20 animate-pulse rounded-lg" />
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
