import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import type { RouterOutputs } from "~/utils/api";
import { trpc } from "~/utils/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type EventItem = RouterOutputs["event"]["all"][number];
type LiveEventItem = RouterOutputs["liveEvent"]["page"]["items"][number];

type UnifiedRow =
  | { kind: "created"; event: EventItem; sortTime: number }
  | { kind: "live"; event: LiveEventItem; sortTime: number };

type GenreFilter =
  | "orchestral"
  | "opera"
  | "chamber"
  | "solo_recital"
  | "choral"
  | "ballet"
  | "jazz";

// ─── Constants ────────────────────────────────────────────────────────────────

const GENRES: { value: GenreFilter; label: string }[] = [
  { value: "orchestral", label: "Orchestral" },
  { value: "opera", label: "Opera" },
  { value: "chamber", label: "Chamber" },
  { value: "solo_recital", label: "Solo Recital" },
  { value: "choral", label: "Choral" },
  { value: "ballet", label: "Ballet" },
  { value: "jazz", label: "Jazz" },
];

const VENUE_SHORT: Record<string, string> = {
  msm: "MSM",
  juilliard: "Juilliard",
  met_opera: "Met Opera",
  carnegie_hall: "Carnegie",
  ny_phil: "NY Phil",
  nycballet: "NYC Ballet",
};

const GENRE_COLORS: Record<string, string> = {
  orchestral: "#1D4ED8",
  opera: "#A21CAF",
  chamber: "#15803D",
  solo_recital: "#B45309",
  choral: "#BE123C",
  ballet: "#9D174D",
  jazz: "#6D28D9",
};

const PAGE_SIZE = 15;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseLiveSortTime(ev: LiveEventItem): number {
  if (ev.date) return new Date(ev.date).getTime();
  if (!ev.dateText?.trim()) return Number.MAX_SAFE_INTEGER;
  const raw = ev.dateText.replace(/\s+/g, " ").trim();
  const direct = new Date(raw).getTime();
  if (!isNaN(direct)) return direct;
  const first = raw.split(/\s[-|]\s/)[0]?.trim();
  if (!first) return Number.MAX_SAFE_INTEGER;
  const year = /\b((?:19|20)\d{2})\b/.exec(raw)?.[1];
  const withYear =
    year && !/\b(?:19|20)\d{2}\b/.test(first) ? `${first}, ${year}` : first;
  const t = new Date(withYear).getTime();
  return isNaN(t) ? Number.MAX_SAFE_INTEGER : t;
}

function parseLiveDate(ev: LiveEventItem): Date | null {
  if (ev.date) {
    const d = new Date(ev.date);
    if (!isNaN(d.getTime())) return d;
  }
  const raw = ev.dateText?.split(/\s*\|/)[0]?.trim();
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

function friendlyDate(date: Date): string {
  const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
  const monthDay = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${weekday}, ${monthDay} · ${time}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DateThumb({ date }: { date: Date }) {
  return (
    <View className="h-full w-full items-center justify-center bg-amber-100 dark:bg-amber-900/30">
      <Text className="text-[10px] font-semibold uppercase text-orange-600 dark:text-orange-300">
        {date.toLocaleDateString("en-US", { month: "short" })}
      </Text>
      <Text className="text-xl font-bold leading-none text-orange-700 dark:text-orange-200">
        {date.getDate()}
      </Text>
      <Text className="mt-0.5 text-[9px] font-medium text-orange-500 dark:text-orange-400">
        {date.toLocaleDateString("en-US", { weekday: "short" })}
      </Text>
    </View>
  );
}

function Tag({ label, color }: { label: string; color: string }) {
  return (
    <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: color + "22" }}>
      <Text style={{ color, fontSize: 10, fontWeight: "600" }}>{label}</Text>
    </View>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="active:opacity-70">
      <View
        className={
          active
            ? "rounded-full px-3 py-1.5"
            : "rounded-full border px-3 py-1.5"
        }
        style={
          active
            ? { backgroundColor: "#9C1738" }
            : undefined
        }
      >
        <Text
          className={active ? "text-[11px] font-semibold text-white" : "text-foreground text-[11px] font-semibold"}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

function EventRow({ row }: { row: UnifiedRow }) {
  const router = useRouter();

  if (row.kind === "created") {
    const ev = row.event;
    const date = new Date(ev.date);
    const genreColor = GENRE_COLORS[ev.genre] ?? "#6B7280";

    return (
      <Pressable
        onPress={() =>
          router.push({ pathname: "/event/[id]", params: { id: ev.id } })
        }
        className="active:opacity-70"
      >
        <View className="bg-card mb-3 flex-row gap-3 rounded-xl border p-3">
          <View className="h-20 w-20 shrink-0 overflow-hidden rounded-lg">
            {ev.imageUrl ? (
              <Image
                source={{ uri: ev.imageUrl }}
                style={{ width: 80, height: 80 }}
                resizeMode="cover"
              />
            ) : (
              <DateThumb date={date} />
            )}
          </View>
          <View className="min-w-0 flex-1">
            <View className="mb-1 flex-row flex-wrap gap-1">
              <Tag label={GENRES.find((g) => g.value === ev.genre)?.label ?? ev.genre} color={genreColor} />
            </View>
            <Text
              className="text-sm font-semibold"
              style={{ color: "#9C1738" }}
              numberOfLines={1}
            >
              {ev.title}
            </Text>
            <Text className="text-muted-foreground mt-0.5 text-xs" numberOfLines={1}>
              {friendlyDate(date)}
            </Text>
            <Text className="text-muted-foreground text-xs" numberOfLines={1}>
              {ev.venue}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  }

  const ev = row.event;
  const date = parseLiveDate(ev);
  const sourceLabel = VENUE_SHORT[ev.source] ?? ev.source;
  const genreColor = GENRE_COLORS[ev.genre] ?? "#6B7280";

  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: "/live-event/[id]", params: { id: ev.id } })
      }
      className="active:opacity-70"
    >
      <View className="bg-card mb-3 flex-row gap-3 rounded-xl border p-3">
        <View className="h-20 w-20 shrink-0 overflow-hidden rounded-lg">
          {ev.imageUrl ? (
            <Image
              source={{ uri: ev.imageUrl }}
              style={{ width: 80, height: 80 }}
              resizeMode="cover"
            />
          ) : date ? (
            <DateThumb date={date} />
          ) : (
            <View className="h-full w-full items-center justify-center bg-amber-100 dark:bg-amber-900/30">
              <Text className="text-[10px] font-semibold text-orange-700">
                Live
              </Text>
            </View>
          )}
        </View>
        <View className="min-w-0 flex-1">
          <View className="mb-1 flex-row flex-wrap gap-1">
            <Tag label={sourceLabel} color="#0369A1" />
            <Tag label={GENRES.find((g) => g.value === ev.genre)?.label ?? ev.genre} color={genreColor} />
          </View>
          <Text
            className="text-sm font-semibold"
            style={{ color: "#9C1738" }}
            numberOfLines={1}
          >
            {ev.title}
          </Text>
          <Text className="text-muted-foreground mt-0.5 text-xs" numberOfLines={1}>
            {date ? friendlyDate(date) : (ev.dateText ?? "")}
          </Text>
          <Text className="text-muted-foreground text-xs" numberOfLines={1}>
            {ev.venueName ?? ""}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function RowSkeleton() {
  return (
    <View className="bg-card mb-3 flex-row gap-3 rounded-xl border p-3">
      <View className="bg-muted h-20 w-20 rounded-lg" />
      <View className="flex-1 gap-2 py-1">
        <View className="bg-muted h-4 w-16 rounded-full" />
        <View className="bg-muted h-4 w-3/4 rounded" />
        <View className="bg-muted h-3 w-1/2 rounded" />
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function EventsScreen() {
  const isDark = useColorScheme() === "dark";
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState<GenreFilter | undefined>();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const genreArg = genre as GenreFilter | undefined;

  const userQuery = useQuery({
    ...trpc.event.all.queryOptions({
      search: search || undefined,
      genre: genreArg,
    }),
  });

  const liveQuery = useInfiniteQuery({
    ...trpc.liveEvent.page.infiniteQueryOptions(
      {
        upcomingOnly: true,
        limit: PAGE_SIZE,
        search: search || undefined,
        genre: genreArg,
      },
      { getNextPageParam: (last) => last.nextCursor ?? undefined },
    ),
    initialPageParam: 0,
  });

  const loading =
    (userQuery.isPending && userQuery.fetchStatus !== "idle") ||
    (liveQuery.isPending && liveQuery.fetchStatus !== "idle");

  const merged: UnifiedRow[] = useMemo(() => {
    const community = (userQuery.data ?? []).map((event) => ({
      kind: "created" as const,
      event,
      sortTime: new Date(event.date).getTime(),
    }));
    const live = (liveQuery.data?.pages.flatMap((p) => p.items) ?? []).map(
      (event) => ({
        kind: "live" as const,
        event,
        sortTime: parseLiveSortTime(event),
      }),
    );
    return [...community, ...live].sort((a, b) => a.sortTime - b.sortTime);
  }, [userQuery.data, liveQuery.data]);

  const visible = merged.slice(0, visibleCount);

  const loadMore = useCallback(() => {
    setVisibleCount((c) => c + PAGE_SIZE);
    if (liveQuery.hasNextPage && !liveQuery.isFetchingNextPage) {
      void liveQuery.fetchNextPage();
    }
  }, [liveQuery]);

  return (
    <SafeAreaView className="bg-background flex-1">
      {/* ── Header ── */}
      <View className="px-4 pt-3 pb-2">
        <Text className="text-foreground text-2xl font-bold">Events</Text>
      </View>

      {/* ── Search ── */}
      <View className="mx-4 mb-3 flex-row items-center gap-2 rounded-full border bg-background px-3">
        <Text className="text-muted-foreground text-base">🔍</Text>
        <TextInput
          value={search}
          onChangeText={(t) => {
            setSearch(t);
            setVisibleCount(PAGE_SIZE);
          }}
          placeholder="Search events…"
          placeholderTextColor={isDark ? "#666" : "#aaa"}
          className="text-foreground flex-1 py-2.5 text-sm"
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {/* ── Genre filter chips ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-3"
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        <FilterChip
          label="All"
          active={!genre}
          onPress={() => {
            setGenre(undefined);
            setVisibleCount(PAGE_SIZE);
          }}
        />
        {GENRES.map((g) => (
          <FilterChip
            key={g.value}
            label={g.label}
            active={genre === g.value}
            onPress={() => {
              setGenre(genre === g.value ? undefined : g.value);
              setVisibleCount(PAGE_SIZE);
            }}
          />
        ))}
      </ScrollView>

      {/* ── List ── */}
      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {loading ? (
          <>
            {[0, 1, 2, 3, 4].map((i) => (
              <RowSkeleton key={i} />
            ))}
          </>
        ) : visible.length === 0 ? (
          <View className="items-center py-16">
            <Text className="text-muted-foreground text-sm">No events found</Text>
            <Text className="text-muted-foreground mt-1 text-xs">
              Try adjusting your filters
            </Text>
          </View>
        ) : (
          <>
            {visible.map((row) => (
              <EventRow key={`${row.kind}-${row.event.id}`} row={row} />
            ))}

            {(merged.length > visibleCount || liveQuery.hasNextPage) && (
              <Pressable
                onPress={loadMore}
                className="mb-4 items-center rounded-xl border py-3 active:opacity-70"
                disabled={liveQuery.isFetchingNextPage}
              >
                {liveQuery.isFetchingNextPage ? (
                  <ActivityIndicator size="small" color="#9C1738" />
                ) : (
                  <Text className="text-foreground text-sm font-medium">
                    See more
                  </Text>
                )}
              </Pressable>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
