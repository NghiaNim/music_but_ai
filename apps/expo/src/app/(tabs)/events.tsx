import { useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import type { RouterOutputs } from "~/utils/api";
import { trpc } from "~/utils/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type EventItem = RouterOutputs["event"]["all"][number];
type LiveEventItem = RouterOutputs["liveEvent"]["page"]["items"][number];
type VenueSource =
  | "msm"
  | "juilliard"
  | "met_opera"
  | "carnegie_hall"
  | "ny_phil"
  | "nycballet";
type SourceFilter = "all" | "community" | VenueSource;

function isVenueSource(
  s: SourceFilter,
): s is Exclude<SourceFilter, "all" | "community"> {
  return s !== "all" && s !== "community";
}

type UnifiedRow =
  | { kind: "created"; event: EventItem }
  | { kind: "live"; event: LiveEventItem };

// ─── Constants ────────────────────────────────────────────────────────────────

const SOURCE_FILTERS: { value: SourceFilter; label: string }[] = [
  { value: "all", label: "All Sources" },
  { value: "community", label: "Community" },
  { value: "msm", label: "MSM" },
  { value: "juilliard", label: "Juilliard" },
  { value: "met_opera", label: "Met Opera" },
  { value: "carnegie_hall", label: "Carnegie" },
  { value: "ny_phil", label: "NY Phil" },
  { value: "nycballet", label: "NYC Ballet" },
];

const GENRE_OPTIONS = [
  { value: "orchestral", label: "Orchestral" },
  { value: "opera", label: "Opera" },
  { value: "chamber", label: "Chamber" },
  { value: "solo_recital", label: "Solo Recital" },
  { value: "choral", label: "Choral" },
  { value: "ballet", label: "Ballet" },
  { value: "jazz", label: "Jazz" },
] as const;

const DIFFICULTY_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
] as const;

const TICKETED_OPTIONS = [
  { value: "ticketed" as const, label: "Ticketed" },
  { value: "non_ticketed" as const, label: "Non-Ticketed" },
];

const GENRE_LABELS: Record<string, string> = {
  orchestral: "Orchestral",
  opera: "Opera",
  chamber: "Chamber",
  solo_recital: "Solo Recital",
  choral: "Choral",
  ballet: "Ballet",
  jazz: "Jazz",
};

const VENUE_SOURCE_LABELS: Record<string, string> = {
  msm: "Manhattan School of Music",
  juilliard: "Juilliard",
  met_opera: "Metropolitan Opera",
  carnegie_hall: "Carnegie Hall",
  ny_phil: "New York Philharmonic",
  nycballet: "New York City Ballet",
};

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: "Beginner Friendly",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

// ─── Tag color helpers ────────────────────────────────────────────────────────

interface TagColors {
  bg: string;
  text: string;
}

const GENRE_TAG_COLORS: Record<string, TagColors> = {
  orchestral: { bg: "#EFF6FF", text: "#1D4ED8" },
  opera: { bg: "#FDF4FF", text: "#A21CAF" },
  chamber: { bg: "#ECFDF5", text: "#15803D" },
  solo_recital: { bg: "#FFFBEB", text: "#B45309" },
  choral: { bg: "#FFF1F2", text: "#BE123C" },
  ballet: { bg: "#FDF2F8", text: "#9D174D" },
  jazz: { bg: "#F5F3FF", text: "#6D28D9" },
};

const SOURCE_TAG_COLORS: Partial<Record<VenueSource, TagColors>> = {
  msm: { bg: "#FEF2F2", text: "#B91C1C" },
  juilliard: { bg: "#EFF6FF", text: "#1D4ED8" },
  met_opera: { bg: "#F5F3FF", text: "#7C3AED" },
  carnegie_hall: { bg: "#FFFBEB", text: "#B45309" },
  ny_phil: { bg: "#EFF6FF", text: "#1D4ED8" },
  nycballet: { bg: "#FDF2F8", text: "#9D174D" },
};

const DIFFICULTY_TAG_COLORS: Record<string, TagColors> = {
  beginner: { bg: "#D1FAE5", text: "#065F46" },
  intermediate: { bg: "#FEF3C7", text: "#92400E" },
  advanced: { bg: "#FFE4E6", text: "#9F1239" },
};

function genreColors(genre?: string | null): TagColors {
  return (
    (genre ? GENRE_TAG_COLORS[genre] : undefined) ?? {
      bg: "#F4F4F5",
      text: "#3F3F46",
    }
  );
}
function sourceColors(source?: string | null): TagColors {
  return (
    (source ? SOURCE_TAG_COLORS[source as VenueSource] : undefined) ?? {
      bg: "#F4F4F5",
      text: "#3F3F46",
    }
  );
}
function difficultyColors(difficulty?: string | null): TagColors {
  return (
    (difficulty ? DIFFICULTY_TAG_COLORS[difficulty] : undefined) ?? {
      bg: "#F4F4F5",
      text: "#3F3F46",
    }
  );
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

const LOCALE = "en-US" as const;

function formatFriendlyDate(date: Date): string {
  const weekday = date.toLocaleDateString(LOCALE, { weekday: "short" });
  const monthDayYear = date.toLocaleDateString(LOCALE, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const time = date.toLocaleTimeString(LOCALE, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${weekday}, ${monthDayYear} · ${time}`;
}

function parseLiveEventInstant(ev: LiveEventItem): Date | null {
  if (ev.date) {
    const d = new Date(ev.date);
    if (!Number.isNaN(d.getTime())) return d;
  }
  const raw = ev.dateText?.split(/\s*\|/)[0]?.trim() ?? ev.dateText?.trim();
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function liveEventWhenLine(ev: LiveEventItem): string {
  const d = parseLiveEventInstant(ev);
  if (d) return formatFriendlyDate(d);
  return ev.dateText?.replace(/\s*\|.*$/, "").trim() ?? "";
}

function dateTextSortTime(dateText: string | null | undefined): number {
  if (!dateText?.trim()) return Number.MAX_SAFE_INTEGER;
  const raw = dateText.replace(/\s+/g, " ").trim();
  const direct = new Date(raw).getTime();
  if (!Number.isNaN(direct)) return direct;
  const first = raw.split(/\s[-|]\s/)[0]?.trim();
  if (!first) return Number.MAX_SAFE_INTEGER;
  const year = /\b((?:19|20)\d{2})\b/.exec(raw)?.[1];
  const withYear =
    year && !/\b(?:19|20)\d{2}\b/.test(first) ? `${first}, ${year}` : first;
  const parsed = new Date(withYear).getTime();
  return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
}

function rowSortTime(row: UnifiedRow): number {
  return row.kind === "created"
    ? new Date(row.event.date).getTime()
    : (row.event.date?.getTime() ?? dateTextSortTime(row.event.dateText));
}

function matchesTicketed(
  row: UnifiedRow,
  filter: "ticketed" | "non_ticketed",
): boolean {
  const has =
    row.kind === "created" ? !!row.event.ticketUrl : !!row.event.buyUrl;
  return filter === "ticketed" ? has : !has;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Tag({ label, colors }: { label: string; colors: TagColors }) {
  return (
    <View
      style={{
        backgroundColor: colors.bg,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 2,
      }}
    >
      <Text style={{ color: colors.text, fontSize: 10, fontWeight: "600" }}>
        {label}
      </Text>
    </View>
  );
}

function CalendarDateThumb({ date }: { date: Date }) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FEF3C7",
      }}
    >
      <Text
        style={{
          fontSize: 10,
          fontWeight: "600",
          textTransform: "uppercase",
          color: "#EA580C",
        }}
      >
        {date.toLocaleDateString(LOCALE, { month: "short" })}
      </Text>
      <Text
        style={{
          fontSize: 20,
          fontWeight: "700",
          lineHeight: 24,
          color: "#C2410C",
        }}
      >
        {date.getDate()}
      </Text>
      <Text
        style={{
          fontSize: 9,
          fontWeight: "500",
          color: "#F97316",
          marginTop: 2,
        }}
      >
        {date.toLocaleDateString(LOCALE, { weekday: "short" })}
      </Text>
    </View>
  );
}

function EventCard({
  event,
  onPress,
  isDark,
}: {
  event: EventItem;
  onPress: () => void;
  isDark: boolean;
}) {
  const date = new Date(event.date);
  return (
    <Pressable onPress={onPress}>
      <View
        style={{
          flexDirection: "row",
          gap: 12,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: isDark ? "#2D2D2D" : "#E5E7EB",
          backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF",
          padding: 12,
        }}
      >
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 8,
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {event.imageUrl ? (
            <Image
              source={{ uri: event.imageUrl }}
              style={{ width: 80, height: 80 }}
              resizeMode="cover"
            />
          ) : (
            <CalendarDateThumb date={date} />
          )}
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 4,
              marginBottom: 4,
            }}
          >
            <Tag
              label={GENRE_LABELS[event.genre] ?? event.genre}
              colors={genreColors(event.genre)}
            />
            <Tag
              label={DIFFICULTY_LABELS[event.difficulty] ?? event.difficulty}
              colors={difficultyColors(event.difficulty)}
            />
          </View>
          <Text
            style={{ fontSize: 14, fontWeight: "600", color: "#9C1738" }}
            numberOfLines={1}
          >
            {event.title}
          </Text>
          <Text
            style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}
            numberOfLines={1}
          >
            {formatFriendlyDate(date)} · {event.venue}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function LiveEventCard({
  event,
  onPress,
  isDark,
}: {
  event: LiveEventItem;
  onPress: () => void;
  isDark: boolean;
}) {
  const when = liveEventWhenLine(event);
  const venue = event.venueName?.trim() ?? "";
  const thumbDate = parseLiveEventInstant(event);
  const sourceLabel = VENUE_SOURCE_LABELS[event.source] ?? event.source;

  return (
    <Pressable onPress={onPress}>
      <View
        style={{
          flexDirection: "row",
          gap: 12,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: isDark ? "#2D2D2D" : "#E5E7EB",
          backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF",
          padding: 12,
        }}
      >
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 8,
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {event.imageUrl ? (
            <Image
              source={{ uri: event.imageUrl }}
              style={{ width: 80, height: 80 }}
              resizeMode="cover"
            />
          ) : thumbDate ? (
            <CalendarDateThumb date={thumbDate} />
          ) : (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#FEF3C7",
              }}
            >
              <Text
                style={{ fontSize: 10, fontWeight: "600", color: "#C2410C" }}
              >
                Live
              </Text>
            </View>
          )}
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 4,
              marginBottom: 4,
            }}
          >
            <Tag label={sourceLabel} colors={sourceColors(event.source)} />
            <Tag
              label={GENRE_LABELS[event.genre] ?? event.genre}
              colors={genreColors(event.genre)}
            />
          </View>
          <Text
            style={{ fontSize: 14, fontWeight: "600", color: "#9C1738" }}
            numberOfLines={1}
          >
            {event.title}
          </Text>
          <Text
            style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}
            numberOfLines={1}
          >
            {when}
            {when && venue ? " · " : ""}
            {venue}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function FilterChip({
  label,
  active,
  onPress,
  isDark,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  isDark: boolean;
}) {
  return (
    <Pressable onPress={onPress}>
      <View
        style={{
          borderRadius: 999,
          paddingHorizontal: 12,
          paddingVertical: 6,
          backgroundColor: active ? "#9C1738" : "transparent",
          borderWidth: active ? 0 : 1,
          borderColor: isDark ? "#3F3F46" : "#D1D5DB",
        }}
      >
        <Text
          style={{
            fontSize: 11,
            fontWeight: "500",
            color: active ? "#FFFFFF" : isDark ? "#9CA3AF" : "#6B7280",
          }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

function RowSkeleton({ isDark }: { isDark: boolean }) {
  const skBg = isDark ? "#2D2D2D" : "#F3F4F6";
  return (
    <View
      style={{
        flexDirection: "row",
        gap: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: isDark ? "#2D2D2D" : "#E5E7EB",
        backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF",
        padding: 12,
      }}
    >
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 8,
          backgroundColor: skBg,
        }}
      />
      <View style={{ flex: 1, gap: 8, paddingVertical: 4 }}>
        <View style={{ flexDirection: "row", gap: 4 }}>
          <View
            style={{
              height: 14,
              width: 64,
              borderRadius: 999,
              backgroundColor: skBg,
            }}
          />
          <View
            style={{
              height: 14,
              width: 80,
              borderRadius: 999,
              backgroundColor: skBg,
            }}
          />
        </View>
        <View
          style={{
            height: 14,
            width: "75%",
            borderRadius: 4,
            backgroundColor: skBg,
          }}
        />
        <View
          style={{
            height: 12,
            width: "50%",
            borderRadius: 4,
            backgroundColor: skBg,
          }}
        />
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function EventsScreen() {
  const router = useRouter();
  const isDark = useColorScheme() === "dark";
  const bg = isDark ? "#111111" : "#FFFAEF";
  const textPrimary = isDark ? "#F9FAFB" : "#111827";

  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [genreFilter, setGenreFilter] = useState<string | undefined>();
  const [difficultyFilter, setDifficultyFilter] = useState<
    string | undefined
  >();
  const [ticketedFilter, setTicketedFilter] = useState<
    "ticketed" | "non_ticketed" | undefined
  >();

  const showUser = sourceFilter === "all" || sourceFilter === "community";
  const liveSource: VenueSource | undefined = isVenueSource(sourceFilter)
    ? sourceFilter
    : undefined;
  const showLive = sourceFilter === "all" || liveSource !== undefined;

  const genreArg = genreFilter as
    | "orchestral"
    | "opera"
    | "chamber"
    | "solo_recital"
    | "choral"
    | "ballet"
    | "jazz"
    | undefined;
  const difficultyArg = difficultyFilter as
    | "beginner"
    | "intermediate"
    | "advanced"
    | undefined;

  const userQuery = useQuery({
    ...trpc.event.all.queryOptions({
      search: search || undefined,
      genre: genreArg,
      difficulty: difficultyArg,
    }),
    enabled: showUser,
  });

  const liveQuery = useQuery({
    ...trpc.liveEvent.page.queryOptions({
      upcomingOnly: true,
      limit: 100,
      cursor: 0,
      search: search || undefined,
      genre: genreArg,
      source: liveSource,
      difficulty: difficultyArg,
    }),
    enabled: showLive,
  });

  const isLoading =
    (showUser && userQuery.isPending && userQuery.fetchStatus !== "idle") ||
    (showLive && liveQuery.isPending && liveQuery.fetchStatus !== "idle");

  const userEvents: UnifiedRow[] = showUser
    ? (userQuery.data ?? []).map((event) => ({ kind: "created", event }))
    : [];
  const liveEvents: UnifiedRow[] = showLive
    ? (liveQuery.data?.items ?? []).map((event) => ({ kind: "live", event }))
    : [];

  const merged = useMemo(
    () =>
      [...userEvents, ...liveEvents].sort(
        (a, b) => rowSortTime(a) - rowSortTime(b),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userQuery.data, liveQuery.data],
  );

  const filtered = useMemo(
    () =>
      !ticketedFilter
        ? merged
        : merged.filter((row) => matchesTicketed(row, ticketedFilter)),
    [merged, ticketedFilter],
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View
          style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 }}
        >
          <Text
            style={{
              fontSize: 24,
              fontWeight: "700",
              color: textPrimary,
              letterSpacing: -0.5,
            }}
          >
            Events
          </Text>
          <Text style={{ fontSize: 14, color: "#6B7280", marginTop: 2 }}>
            Community listings and NYC conservatory venues
          </Text>
        </View>

        {/* Search */}
        <View
          style={{
            marginHorizontal: 16,
            marginVertical: 12,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: isDark ? "#3F3F46" : "#E5E7EB",
            backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF",
            paddingHorizontal: 12,
          }}
        >
          <Text style={{ fontSize: 14, color: "#9CA3AF" }}>🔍</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search"
            placeholderTextColor={isDark ? "#666" : "#999"}
            style={{ flex: 1, height: 36, fontSize: 14, color: textPrimary }}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>

        {/* Source filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 8 }}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 6 }}
        >
          {SOURCE_FILTERS.map((f) => (
            <FilterChip
              key={f.value}
              label={f.label}
              active={sourceFilter === f.value}
              isDark={isDark}
              onPress={() => setSourceFilter(f.value)}
            />
          ))}
        </ScrollView>

        {/* Genre filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 8 }}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 6 }}
        >
          <FilterChip
            label="All Categories"
            active={!genreFilter}
            isDark={isDark}
            onPress={() => setGenreFilter(undefined)}
          />
          {GENRE_OPTIONS.map((g) => (
            <FilterChip
              key={g.value}
              label={g.label}
              active={genreFilter === g.value}
              isDark={isDark}
              onPress={() =>
                setGenreFilter(genreFilter === g.value ? undefined : g.value)
              }
            />
          ))}
        </ScrollView>

        {/* Difficulty filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 8 }}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 6 }}
        >
          <FilterChip
            label="All Levels"
            active={!difficultyFilter}
            isDark={isDark}
            onPress={() => setDifficultyFilter(undefined)}
          />
          {DIFFICULTY_OPTIONS.map((d) => (
            <FilterChip
              key={d.value}
              label={d.label}
              active={difficultyFilter === d.value}
              isDark={isDark}
              onPress={() =>
                setDifficultyFilter(
                  difficultyFilter === d.value ? undefined : d.value,
                )
              }
            />
          ))}
        </ScrollView>

        {/* Ticketing filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 12 }}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 6 }}
        >
          <FilterChip
            label="All Ticketing Types"
            active={!ticketedFilter}
            isDark={isDark}
            onPress={() => setTicketedFilter(undefined)}
          />
          {TICKETED_OPTIONS.map((t) => (
            <FilterChip
              key={t.value}
              label={t.label}
              active={ticketedFilter === t.value}
              isDark={isDark}
              onPress={() =>
                setTicketedFilter(
                  ticketedFilter === t.value ? undefined : t.value,
                )
              }
            />
          ))}
        </ScrollView>

        {/* Event list */}
        <View style={{ gap: 12, paddingHorizontal: 16 }}>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <RowSkeleton key={i} isDark={isDark} />
            ))
          ) : filtered.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 64 }}>
              <Text style={{ fontSize: 14, color: "#6B7280" }}>
                No events found
              </Text>
              <Text style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>
                Try adjusting your filters
              </Text>
            </View>
          ) : (
            filtered.map((row) =>
              row.kind === "created" ? (
                <EventCard
                  key={`created-${row.event.id}`}
                  event={row.event}
                  isDark={isDark}
                  onPress={() => router.push(`/event/${row.event.id}` as never)}
                />
              ) : (
                <LiveEventCard
                  key={`live-${row.event.id}`}
                  event={row.event}
                  isDark={isDark}
                  onPress={() =>
                    router.push(`/live-event/${row.event.id}` as never)
                  }
                />
              ),
            )
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
