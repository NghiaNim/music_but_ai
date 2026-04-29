"use client";

import {
  Image,
  Pressable,
  ScrollView,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import type { RouterOutputs } from "~/utils/api";
import { trpc } from "~/utils/api";
import { authClient } from "~/utils/auth";

// ─── Types ──────────────────────────────────────────────────────────────────

type EventItem = RouterOutputs["event"]["all"][number];
type LiveEventItem = RouterOutputs["liveEvent"]["page"]["items"][number];

type UnifiedRow =
  | { kind: "created"; event: EventItem; sortTime: number }
  | { kind: "live"; event: LiveEventItem; sortTime: number };

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function mergeEvents(
  community: EventItem[],
  live: LiveEventItem[],
): UnifiedRow[] {
  const rows: UnifiedRow[] = [
    ...community.map((event) => ({
      kind: "created" as const,
      event,
      sortTime: new Date(event.date).getTime(),
    })),
    ...live.map((event) => ({
      kind: "live" as const,
      event,
      sortTime: parseLiveSortTime(event),
    })),
  ];
  return rows.sort((a, b) => a.sortTime - b.sortTime);
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

function parseLiveDate(ev: LiveEventItem): Date | null {
  if (ev.date) {
    const d = new Date(ev.date);
    if (!isNaN(d.getTime())) return d;
  }
  const raw = ev.dateText?.split(/\s*\|/)[0]?.trim() ?? ev.dateText?.trim();
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

const GENRE_LABELS: Record<string, string> = {
  orchestral: "Orchestral",
  opera: "Opera",
  chamber: "Chamber",
  solo_recital: "Solo Recital",
  choral: "Choral",
  ballet: "Ballet",
  jazz: "Jazz",
};

const VENUE_SHORT: Record<string, string> = {
  msm: "MSM",
  juilliard: "Juilliard",
  met_opera: "Met Opera",
  carnegie_hall: "Carnegie",
  ny_phil: "NY Phil",
  nycballet: "NYC Ballet",
};

// ─── Sub-components ──────────────────────────────────────────────────────────

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
    <View
      className="rounded-full px-2 py-0.5"
      style={{ backgroundColor: color + "22" }}
    >
      <Text style={{ color, fontSize: 10, fontWeight: "600" }}>{label}</Text>
    </View>
  );
}

const GENRE_COLORS: Record<string, string> = {
  orchestral: "#1D4ED8",
  opera: "#A21CAF",
  chamber: "#15803D",
  solo_recital: "#B45309",
  choral: "#BE123C",
  ballet: "#9D174D",
  jazz: "#6D28D9",
};

function EventCard({ row }: { row: UnifiedRow }) {
  const router = useRouter();

  if (row.kind === "created") {
    const ev = row.event;
    const date = new Date(ev.date);
    const dateStr = friendlyDate(date);
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
              <Tag
                label={GENRE_LABELS[ev.genre] ?? ev.genre}
                color={genreColor}
              />
            </View>
            <Text
              className="text-sm font-semibold"
              style={{ color: "#9C1738" }}
              numberOfLines={1}
            >
              {ev.title}
            </Text>
            <Text
              className="text-muted-foreground mt-0.5 text-xs"
              numberOfLines={1}
            >
              {dateStr}
            </Text>
            <Text
              className="text-muted-foreground text-xs"
              numberOfLines={1}
            >
              {ev.venue}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  }

  const ev = row.event;
  const date = parseLiveDate(ev);
  const dateStr = date ? friendlyDate(date) : ev.dateText ?? "";
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
              <Text className="text-[10px] font-semibold text-orange-700 dark:text-orange-200">
                Live
              </Text>
            </View>
          )}
        </View>
        <View className="min-w-0 flex-1">
          <View className="mb-1 flex-row flex-wrap gap-1">
            <Tag label={sourceLabel} color="#0369A1" />
            <Tag label={GENRE_LABELS[ev.genre] ?? ev.genre} color={genreColor} />
          </View>
          <Text
            className="text-sm font-semibold"
            style={{ color: "#9C1738" }}
            numberOfLines={1}
          >
            {ev.title}
          </Text>
          <Text
            className="text-muted-foreground mt-0.5 text-xs"
            numberOfLines={1}
          >
            {dateStr}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function EventsSkeleton() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <View key={i} className="bg-card mb-3 flex-row gap-3 rounded-xl border p-3">
          <View className="bg-muted h-20 w-20 animate-pulse rounded-lg" />
          <View className="flex-1 gap-2 py-1">
            <View className="bg-muted h-4 w-16 animate-pulse rounded-full" />
            <View className="bg-muted h-4 w-3/4 animate-pulse rounded" />
            <View className="bg-muted h-3 w-1/2 animate-pulse rounded" />
          </View>
        </View>
      ))}
    </>
  );
}

function ExploreCard({
  label,
  subtitle,
  bgColor,
  icon,
  onPress,
}: {
  label: string;
  subtitle: string;
  bgColor: string;
  icon: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="active:opacity-70" style={{ width: "48%" }}>
      <View
        className="items-center gap-2 rounded-2xl border p-5"
        style={{ backgroundColor: bgColor }}
      >
        <Text style={{ fontSize: 28 }}>{icon}</Text>
        <View>
          <Text className="text-center text-sm font-semibold text-foreground">
            {label}
          </Text>
          <Text className="text-muted-foreground mt-0.5 text-center text-[11px]">
            {subtitle}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const isDark = useColorScheme() === "dark";
  const { data: session } = authClient.useSession();
  const firstName = session?.user.name?.split(" ")[0] ?? "friend";

  const { data: communityData, isPending: communityPending } = useQuery({
    ...trpc.event.all.queryOptions({}),
  });

  const { data: liveData, isPending: livePending } = useQuery({
    ...trpc.liveEvent.page.queryOptions({
      upcomingOnly: true,
      limit: 20,
      cursor: 0,
    }),
  });

  const loading = communityPending || livePending;

  const featured = loading
    ? []
    : mergeEvents(communityData ?? [], liveData?.items ?? []).slice(0, 4);

  return (
    <SafeAreaView className="bg-background flex-1">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ── */}
        <View
          className="px-4 pt-5 pb-4"
          style={{
            backgroundColor: isDark
              ? "rgba(120,53,15,0.08)"
              : "rgba(254,243,199,0.6)",
          }}
        >
          <Text className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400">
            {session ? `Hey ${firstName} ~` : "Welcome to Classica"}
          </Text>
          <Text className="text-foreground text-2xl font-bold tracking-tight">
            {session
              ? "What shall we listen to today?"
              : "Your next favorite concert is waiting"}
          </Text>
          <Text className="text-muted-foreground mt-1.5 text-sm">
            Discover classical & jazz, powered by curiosity
          </Text>
        </View>

        {/* ── Onboarding CTA ── */}
        {!session && (
          <View className="mx-4 mt-4">
            <Pressable
              onPress={() => router.push("/sign-in" as never)}
              className="active:opacity-80"
            >
              <View className="flex-row items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
                <Text style={{ fontSize: 28 }}>🎵</Text>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground">
                    Discover your sound
                  </Text>
                  <Text className="text-muted-foreground text-xs">
                    2 min taste quiz — find concerts you'll love
                  </Text>
                </View>
                <Text className="text-amber-600 text-sm font-semibold">
                  Start →
                </Text>
              </View>
            </Pressable>
          </View>
        )}

        {/* ── Upcoming Events ── */}
        <View className="mt-5 px-4">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-foreground text-lg font-semibold">
              Upcoming Events
            </Text>
            <Pressable
              onPress={() => router.push("/(tabs)/events" as never)}
              className="active:opacity-60"
            >
              <Text className="text-primary text-sm font-medium">See all</Text>
            </Pressable>
          </View>

          {loading ? (
            <EventsSkeleton />
          ) : featured.length === 0 ? (
            <Text className="text-muted-foreground text-sm">
              No upcoming events
            </Text>
          ) : (
            featured.map((row) => (
              <EventCard
                key={`${row.kind}-${row.event.id}`}
                row={row}
              />
            ))
          )}
        </View>

        {/* ── Ask Tanny ── */}
        <View className="mt-1 px-4">
          <Pressable
            onPress={() => router.push("/(tabs)/chat" as never)}
            className="active:opacity-70"
          >
            <View className="bg-card flex-row items-center gap-4 rounded-2xl border p-4">
              <View
                className="h-[4.75rem] w-[4.75rem] shrink-0 items-center justify-center overflow-hidden rounded-full"
                style={{ backgroundColor: "#F5E6DC" }}
              >
                <Image
                  // eslint-disable-next-line @typescript-eslint/no-require-imports
                  source={require("../../../assets/tanny.png")}
                  style={{ width: 76, height: 76 }}
                  resizeMode="contain"
                />
              </View>
              <View className="min-w-0 flex-1">
                <Text className="text-foreground font-semibold">Ask Tanny</Text>
                <Text className="text-muted-foreground text-xs">
                  Your musical sidekick — recs, trivia, anything!
                </Text>
              </View>
              <Text className="text-muted-foreground text-lg">›</Text>
            </View>
          </Pressable>
        </View>

        {/* ── Explore Grid ── */}
        <View className="mt-5 px-4">
          <Text className="text-foreground mb-3 text-lg font-semibold">
            Explore
          </Text>
          <View className="flex-row flex-wrap justify-between gap-y-3">
            <ExploreCard
              label="For Beginners"
              subtitle="First concert? Start here"
              bgColor={isDark ? "rgba(6,78,59,0.2)" : "#ECFDF5"}
              icon="🌱"
              onPress={() => router.push("/(tabs)/events" as never)}
            />
            <ExploreCard
              label="Get a Rec"
              subtitle="AI-picked just for you"
              bgColor={isDark ? "rgba(76,29,149,0.2)" : "#F5F3FF"}
              icon="✨"
              onPress={() => router.push("/(tabs)/chat" as never)}
            />
            <ExploreCard
              label="Learn"
              subtitle="Classical & jazz 101"
              bgColor={isDark ? "rgba(120,53,15,0.2)" : "#FFFBEB"}
              icon="📖"
              onPress={() => router.push("/(tabs)/learn" as never)}
            />
            <ExploreCard
              label="My Badges"
              subtitle="See what you've earned"
              bgColor={isDark ? "rgba(12,74,110,0.2)" : "#F0F9FF"}
              icon="🏆"
              onPress={() => router.push("/(tabs)/profile" as never)}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
