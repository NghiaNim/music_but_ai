"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  useInfiniteQuery,
  useQuery,
  useSuspenseQuery,
} from "@tanstack/react-query";

import type { RouterOutputs } from "@acme/api";
import { cn } from "@acme/ui";
import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";

import {
  DIFFICULTY_COLORS,
  DIFFICULTY_LABELS,
  GENRE_LABELS,
  VENUE_SOURCE_FULL_NAMES,
} from "~/lib/event-display-labels";
import {
  formatFriendlyDate,
  formatMonthShort,
  formatWeekdayShort,
} from "~/lib/format-event-date";
import { useTRPC } from "~/trpc/react";

type EventItem = RouterOutputs["event"]["all"][number];
type LiveEventItem = RouterOutputs["liveEvent"]["page"]["items"][number];

type UnifiedRow =
  | { kind: "created"; event: EventItem }
  | { kind: "live"; event: LiveEventItem };

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

const VENUE_SOURCES = [
  "msm",
  "juilliard",
  "met_opera",
  "carnegie_hall",
  "ny_phil",
  "nycballet",
] as const;

type VenueSource = (typeof VENUE_SOURCES)[number];
type SourceFilter = "all" | "community" | VenueSource;

const SOURCE_FILTER_LABELS: Record<SourceFilter, string> = {
  all: "All sources",
  community: "Community",
  msm: "MSM",
  juilliard: "Juilliard",
  met_opera: "Met Opera",
  carnegie_hall: "Carnegie Hall",
  ny_phil: "NY Philharmonic",
  nycballet: "NYC Ballet",
};

const LIVE_PAGE_SIZE = 15;

function dateTextSortTime(dateText: string | null | undefined): number {
  if (!dateText?.trim()) return Number.MAX_SAFE_INTEGER;

  const raw = dateText.replace(/\s+/g, " ").trim();
  const direct = new Date(raw).getTime();
  if (!Number.isNaN(direct)) return direct;

  const firstSegment = raw.split(/\s[-|]\s/)[0]?.trim();
  if (!firstSegment) return Number.MAX_SAFE_INTEGER;

  const year = /\b((?:19|20)\d{2})\b/.exec(raw)?.[1];
  const firstWithYear =
    year && !/\b(?:19|20)\d{2}\b/.test(firstSegment)
      ? `${firstSegment}, ${year}`
      : firstSegment;
  const parsedFirst = new Date(firstWithYear).getTime();
  return Number.isNaN(parsedFirst) ? Number.MAX_SAFE_INTEGER : parsedFirst;
}

function liveSortTime(ev: LiveEventItem): number {
  if (ev.date) return new Date(ev.date).getTime();
  return dateTextSortTime(ev.dateText);
}

function unifiedRowSortTime(row: UnifiedRow): number {
  return row.kind === "created"
    ? new Date(row.event.date).getTime()
    : liveSortTime(row.event);
}

function matchesCityFilter(row: UnifiedRow, city: string): boolean {
  const q = city.toLowerCase();
  if (row.kind === "created") {
    const e = row.event;
    return (
      e.venue.toLowerCase().includes(q) ||
      (e.venueAddress?.toLowerCase().includes(q) ?? false)
    );
  }
  const e = row.event;
  return (
    (e.venueName?.toLowerCase().includes(q) ?? false) ||
    (e.location?.toLowerCase().includes(q) ?? false)
  );
}

function matchesTicketedFilter(
  row: UnifiedRow,
  filter: "ticketed" | "non_ticketed",
): boolean {
  if (row.kind === "created") {
    const has = !!row.event.ticketUrl;
    return filter === "ticketed" ? has : !has;
  }
  const has = !!row.event.buyUrl;
  return filter === "ticketed" ? has : !has;
}

export function FeaturedEvents() {
  const trpc = useTRPC();
  const { data: community } = useSuspenseQuery(trpc.event.all.queryOptions({}));
  const { data: livePage } = useSuspenseQuery(
    trpc.liveEvent.page.queryOptions({
      upcomingOnly: true,
      limit: 50,
      cursor: 0,
    }),
  );

  const liveEvents = livePage.items;
  const merged: UnifiedRow[] = [
    ...community.map((event) => ({ kind: "created" as const, event })),
    ...liveEvents.map((event) => ({ kind: "live" as const, event })),
  ];
  merged.sort((a, b) => unifiedRowSortTime(a) - unifiedRowSortTime(b));
  const featured = merged.slice(0, 4);

  if (featured.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        No events yet
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {featured.map((row) => (
        <UnifiedEventRow key={`${row.kind}-${row.event.id}`} row={row} />
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
  const [sortBy, setSortBy] = useState<"day_asc" | "day_desc">("day_asc");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [visibleCount, setVisibleCount] = useState(LIVE_PAGE_SIZE);
  const resetVisibleCount = () => setVisibleCount(LIVE_PAGE_SIZE);

  const showUser = sourceFilter === "all" || sourceFilter === "community";
  const liveSource: VenueSource | undefined =
    sourceFilter !== "all" && sourceFilter !== "community"
      ? sourceFilter
      : undefined;
  const showLive = sourceFilter === "all" || liveSource !== undefined;

  const genreArg = genreFilter as (typeof GENRE_OPTIONS)[number] | undefined;

  const userQuery = useQuery({
    ...trpc.event.all.queryOptions({
      search: search || undefined,
      genre: genreArg,
      difficulty: difficultyFilter as
        | "beginner"
        | "intermediate"
        | "advanced"
        | undefined,
    }),
    enabled: showUser,
  });

  const liveQuery = useInfiniteQuery({
    ...trpc.liveEvent.page.infiniteQueryOptions(
      {
        upcomingOnly: true,
        limit: LIVE_PAGE_SIZE,
        search: search || undefined,
        genre: genreArg,
        source: liveSource,
      },
      {
        getNextPageParam: (last) => last.nextCursor ?? undefined,
      },
    ),
    initialPageParam: 0,
    enabled: showLive,
  });

  const loadingInitial =
    (showUser && userQuery.isPending) || (showLive && liveQuery.isPending);

  // When a query is disabled, React Query may still return cached `data` from a
  // previous filter (e.g. community events after switching to “Juilliard” only).
  // Never merge rows for sources we are not currently showing.
  const userEvents = showUser ? (userQuery.data ?? []) : [];
  const liveEvents = showLive
    ? (liveQuery.data?.pages.flatMap((p) => p.items) ?? [])
    : [];

  const merged: UnifiedRow[] = [
    ...userEvents.map((event) => ({ kind: "created" as const, event })),
    ...liveEvents.map((event) => ({ kind: "live" as const, event })),
  ];

  const mergedSorted = [...merged].sort((a, b) => {
    const diff = unifiedRowSortTime(a) - unifiedRowSortTime(b);
    return sortBy === "day_asc" ? diff : -diff;
  });

  const filteredEvents = mergedSorted.filter((row) => {
    if (cityFilter && !matchesCityFilter(row, cityFilter)) return false;
    if (ticketedFilter && !matchesTicketedFilter(row, ticketedFilter))
      return false;
    return true;
  });
  const visibleEvents = filteredEvents.slice(0, visibleCount);

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <SearchIcon />
          <Input
            placeholder="Search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetVisibleCount();
            }}
            className="h-9 w-full rounded-full border-zinc-300 bg-white pl-9 text-sm text-zinc-900 placeholder:text-zinc-900 md:text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-100"
          />
        </div>
        <select
          value={cityFilter ?? ""}
          onChange={(e) => {
            setCityFilter(e.target.value || undefined);
            resetVisibleCount();
          }}
          className="h-9 w-[88px] rounded-full border border-zinc-300 bg-white px-2.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
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
          onChange={(e) => {
            setSortBy(e.target.value as "day_asc" | "day_desc");
            resetVisibleCount();
          }}
          className="h-9 w-[80px] rounded-full border border-zinc-300 bg-white px-2.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        >
          <option value="day_asc">By Date</option>
          <option value="day_desc">Latest Day</option>
        </select>
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        <FilterChip
          label={SOURCE_FILTER_LABELS.all}
          active={sourceFilter === "all"}
          onClick={() => {
            setSourceFilter("all");
            resetVisibleCount();
          }}
        />
        <FilterChip
          label={SOURCE_FILTER_LABELS.community}
          active={sourceFilter === "community"}
          onClick={() => {
            setSourceFilter(sourceFilter === "community" ? "all" : "community");
            resetVisibleCount();
          }}
        />
        {VENUE_SOURCES.map((s) => (
          <FilterChip
            key={s}
            label={SOURCE_FILTER_LABELS[s]}
            active={sourceFilter === s}
            onClick={() => {
              setSourceFilter(sourceFilter === s ? "all" : s);
              resetVisibleCount();
            }}
          />
        ))}
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        <FilterChip
          label="All"
          active={!genreFilter}
          onClick={() => {
            setGenreFilter(undefined);
            resetVisibleCount();
          }}
        />
        {GENRE_OPTIONS.map((g) => (
          <FilterChip
            key={g}
            label={GENRE_LABELS[g] ?? g}
            active={genreFilter === g}
            onClick={() => {
              setGenreFilter(genreFilter === g ? undefined : g);
              resetVisibleCount();
            }}
          />
        ))}
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        <FilterChip
          label="All Levels"
          active={!difficultyFilter}
          onClick={() => {
            setDifficultyFilter(undefined);
            resetVisibleCount();
          }}
        />
        {(["beginner", "intermediate", "advanced"] as const).map((d) => (
          <FilterChip
            key={d}
            label={d.charAt(0).toUpperCase() + d.slice(1)}
            active={difficultyFilter === d}
            onClick={() => {
              setDifficultyFilter(difficultyFilter === d ? undefined : d);
              resetVisibleCount();
            }}
          />
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        <FilterChip
          label="All Ticketing Types"
          active={!ticketedFilter}
          onClick={() => {
            setTicketedFilter(undefined);
            resetVisibleCount();
          }}
        />
        <FilterChip
          label="Ticketed"
          active={ticketedFilter === "ticketed"}
          onClick={() => {
            setTicketedFilter(
              ticketedFilter === "ticketed" ? undefined : "ticketed",
            );
            resetVisibleCount();
          }}
        />
        <FilterChip
          label="Non-Ticketed"
          active={ticketedFilter === "non_ticketed"}
          onClick={() => {
            setTicketedFilter(
              ticketedFilter === "non_ticketed" ? undefined : "non_ticketed",
            );
            resetVisibleCount();
          }}
        />
      </div>

      {loadingInitial ? (
        <EventFeedSkeleton />
      ) : filteredEvents.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16">
          <p className="text-muted-foreground text-sm">No events found</p>
          <p className="text-muted-foreground text-xs">
            Try adjusting your filters
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {visibleEvents.map((row) => (
              <UnifiedEventRow key={`${row.kind}-${row.event.id}`} row={row} />
            ))}
          </div>
          {filteredEvents.length > visibleCount ||
          (showLive && liveQuery.hasNextPage) ? (
            <div className="mt-4 flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-w-[8rem]"
                disabled={liveQuery.isFetchingNextPage}
                onClick={() => {
                  setVisibleCount((v) => v + LIVE_PAGE_SIZE);
                  if (
                    showLive &&
                    liveQuery.hasNextPage &&
                    filteredEvents.length <= visibleCount + LIVE_PAGE_SIZE
                  ) {
                    void liveQuery.fetchNextPage();
                  }
                }}
              >
                {liveQuery.isFetchingNextPage ? "Loading…" : "See more"}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

/** Parsed instant for live cards (DB `date` or ISO / human `dateText`). */
function parseLiveEventInstant(ev: LiveEventItem): Date | null {
  if (ev.date) {
    const d = new Date(ev.date);
    if (!Number.isNaN(d.getTime())) return d;
  }
  const raw = ev.dateText?.split(/\s*\|/)[0]?.trim() ?? ev.dateText?.trim();
  if (!raw) return null;
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return parsed;
  return null;
}

/** Same date line as community `EventCard` (e.g. "Sat, May 2, 2026 · 7:30 PM"). */
function liveEventCardWhenLine(ev: LiveEventItem): string {
  const d = parseLiveEventInstant(ev);
  if (d) return formatFriendlyDate(d);
  const fallback = ev.dateText?.replace(/\s*\|.*$/, "").trim();
  return fallback ?? "";
}

function CalendarDateThumb({ date }: { date: Date }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-linear-to-br from-orange-200 to-amber-100 dark:from-orange-900/50 dark:to-amber-800/30">
      <span className="text-[10px] font-semibold text-orange-600 uppercase dark:text-orange-300">
        {formatMonthShort(date)}
      </span>
      <span className="text-xl leading-none font-bold text-orange-700 dark:text-orange-200">
        {date.getDate()}
      </span>
      <span className="mt-0.5 text-[9px] font-medium text-orange-500 dark:text-orange-400">
        {formatWeekdayShort(date)}
      </span>
    </div>
  );
}

function UnifiedEventRow({ row }: { row: UnifiedRow }) {
  return row.kind === "created" ? (
    <EventCard event={row.event} />
  ) : (
    <LiveEventCard event={row.event} />
  );
}

function EventCard({ event }: { event: EventItem }) {
  const date = new Date(event.date);
  const line = formatFriendlyDate(date);

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
            <CalendarDateThumb date={date} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap gap-1">
            <span className="rounded-full bg-[#ffffff] px-2 py-0.5 text-[10px] font-medium text-zinc-900">
              {GENRE_LABELS[event.genre] ?? event.genre}
            </span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-medium",
                DIFFICULTY_COLORS[event.difficulty],
              )}
            >
              {DIFFICULTY_LABELS[event.difficulty] ?? event.difficulty}
            </span>
          </div>
          <h3
            className="line-clamp-1 text-sm font-semibold"
            style={{ color: "#9C1738" }}
          >
            {event.title}
          </h3>
          <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">
            {line} &middot; {event.venue}
          </p>
        </div>
      </div>
    </Link>
  );
}

function LiveEventCard({ event }: { event: LiveEventItem }) {
  const sourceLabel = VENUE_SOURCE_FULL_NAMES[event.source];
  const when = liveEventCardWhenLine(event);
  const venue = event.venueName?.trim() ?? "";
  const thumbDate = parseLiveEventInstant(event);

  return (
    <Link href={`/live-event/${event.id}`}>
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
          ) : thumbDate ? (
            <CalendarDateThumb date={thumbDate} />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-orange-200 to-amber-100 dark:from-orange-900/50 dark:to-amber-800/30">
              <span className="text-[10px] font-semibold text-orange-700 dark:text-orange-200">
                Live
              </span>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap gap-1">
            <span className="rounded-full bg-[#ffffff] px-2 py-0.5 text-[10px] font-medium text-zinc-900">
              {sourceLabel}
            </span>
            <span className="rounded-full bg-[#ffffff] px-2 py-0.5 text-[10px] font-medium text-zinc-900">
              {GENRE_LABELS[event.genre] ?? event.genre}
            </span>
          </div>
          <h3
            className="line-clamp-1 text-sm font-semibold"
            style={{ color: "#9C1738" }}
          >
            {event.title}
          </h3>
          <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">
            {when}
            {when && venue ? " · " : ""}
            {venue}
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
