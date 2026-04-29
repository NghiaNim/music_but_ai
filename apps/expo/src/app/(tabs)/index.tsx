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
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";

import type { RouterOutputs } from "~/utils/api";
import { trpc } from "~/utils/api";
import { authClient } from "~/utils/auth";
import tonTonAvatar from "../../../assets/ton-ton.png";

// ─── Types ───────────────────────────────────────────────────────────────────

type EventItem = RouterOutputs["event"]["all"][number];
type LiveEventItem = RouterOutputs["liveEvent"]["page"]["items"][number];
type TasteProfile = RouterOutputs["tasteProfile"]["get"];

type UnifiedRow =
  | { kind: "created"; event: EventItem; sortTime: number }
  | { kind: "live"; event: LiveEventItem; sortTime: number };

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

// ─── Sub-components ───────────────────────────────────────────────────────────

function DateThumb({ date }: { date: Date }) {
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
        {date.toLocaleDateString("en-US", { month: "short" })}
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
        {date.toLocaleDateString("en-US", { weekday: "short" })}
      </Text>
    </View>
  );
}

function Tag({ label, color }: { label: string; color: string }) {
  return (
    <View
      style={{
        backgroundColor: color + "22",
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 2,
      }}
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

function EventCard({ row, isDark }: { row: UnifiedRow; isDark: boolean }) {
  const router = useRouter();
  const cardStyle = {
    flexDirection: "row" as const,
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: isDark ? "#2D2D2D" : "#E5E7EB",
    backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF",
    padding: 12,
    marginBottom: 12,
  };

  if (row.kind === "created") {
    const ev = row.event;
    const date = new Date(ev.date);
    const genreColor = GENRE_COLORS[ev.genre] ?? "#6B7280";
    return (
      <Pressable
        onPress={() =>
          router.push({ pathname: "/event/[id]", params: { id: ev.id } })
        }
      >
        <View style={cardStyle}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 8,
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
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
                label={GENRE_LABELS[ev.genre] ?? ev.genre}
                color={genreColor}
              />
            </View>
            <Text
              style={{ fontSize: 14, fontWeight: "600", color: "#9C1738" }}
              numberOfLines={1}
            >
              {ev.title}
            </Text>
            <Text
              style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}
              numberOfLines={1}
            >
              {friendlyDate(date)}
            </Text>
            <Text style={{ fontSize: 12, color: "#6B7280" }} numberOfLines={1}>
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
    >
      <View style={cardStyle}>
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 8,
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {ev.imageUrl ? (
            <Image
              source={{ uri: ev.imageUrl }}
              style={{ width: 80, height: 80 }}
              resizeMode="cover"
            />
          ) : date ? (
            <DateThumb date={date} />
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
            <Tag label={sourceLabel} color="#0369A1" />
            <Tag
              label={GENRE_LABELS[ev.genre] ?? ev.genre}
              color={genreColor}
            />
          </View>
          <Text
            style={{ fontSize: 14, fontWeight: "600", color: "#9C1738" }}
            numberOfLines={1}
          >
            {ev.title}
          </Text>
          <Text
            style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}
            numberOfLines={1}
          >
            {date ? friendlyDate(date) : (ev.dateText ?? "")}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function EventsSkeleton({ isDark }: { isDark: boolean }) {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={{
            flexDirection: "row",
            gap: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: isDark ? "#2D2D2D" : "#E5E7EB",
            backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF",
            padding: 12,
            marginBottom: 12,
          }}
        >
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 8,
              backgroundColor: isDark ? "#2D2D2D" : "#F3F4F6",
            }}
          />
          <View style={{ flex: 1, gap: 8, paddingVertical: 4 }}>
            <View
              style={{
                height: 12,
                width: 64,
                borderRadius: 999,
                backgroundColor: isDark ? "#2D2D2D" : "#F3F4F6",
              }}
            />
            <View
              style={{
                height: 14,
                width: "75%",
                borderRadius: 4,
                backgroundColor: isDark ? "#2D2D2D" : "#F3F4F6",
              }}
            />
            <View
              style={{
                height: 12,
                width: "50%",
                borderRadius: 4,
                backgroundColor: isDark ? "#2D2D2D" : "#F3F4F6",
              }}
            />
          </View>
        </View>
      ))}
    </>
  );
}

function OnboardingCTA({
  session,
  tasteProfile,
  isDark,
}: {
  session: boolean;
  tasteProfile: TasteProfile;
  isDark: boolean;
}) {
  const router = useRouter();

  if (!session) {
    return (
      <Pressable onPress={() => router.push("/sign-in" as never)}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: isDark ? "rgba(120,53,15,0.4)" : "#FDE68A",
            backgroundColor: isDark ? "rgba(120,53,15,0.15)" : "#FFFBEB",
            padding: 16,
          }}
        >
          <Text style={{ fontSize: 28 }}>🎵</Text>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: isDark ? "#F9FAFB" : "#111827",
              }}
            >
              Discover your sound
            </Text>
            <Text style={{ fontSize: 12, color: "#6B7280" }}>
              2 min taste quiz — find concerts you'll love
            </Text>
          </View>
          <Text style={{ color: "#D97706", fontWeight: "600", fontSize: 14 }}>
            Start →
          </Text>
        </View>
      </Pressable>
    );
  }

  if (tasteProfile?.archetype) {
    return (
      <Pressable onPress={() => router.push("/profile/taste" as never)}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: isDark ? "rgba(6,78,59,0.4)" : "#A7F3D0",
            backgroundColor: isDark ? "rgba(6,78,59,0.15)" : "#ECFDF5",
            padding: 16,
          }}
        >
          <Text style={{ fontSize: 32 }}>
            {tasteProfile.badgeEmoji ?? "🎵"}
          </Text>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: isDark ? "#F9FAFB" : "#111827",
              }}
            >
              {tasteProfile.archetype}
            </Text>
            <Text style={{ fontSize: 12, color: "#6B7280" }} numberOfLines={1}>
              {(tasteProfile.tags ?? []).slice(0, 3).join(" · ")}
            </Text>
          </View>
          <Text style={{ color: "#9CA3AF", fontSize: 18 }}>›</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={() => router.push("/onboarding/taste" as never)}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: isDark ? "rgba(120,53,15,0.4)" : "#FDE68A",
          backgroundColor: isDark ? "rgba(120,53,15,0.15)" : "#FFFBEB",
          padding: 16,
        }}
      >
        <Text style={{ fontSize: 28 }}>✨</Text>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: isDark ? "#F9FAFB" : "#111827",
            }}
          >
            Discover your sound
          </Text>
          <Text style={{ fontSize: 12, color: "#6B7280" }}>
            2 min taste quiz — find concerts you'll love
          </Text>
        </View>
        <Text style={{ color: "#D97706", fontWeight: "600", fontSize: 14 }}>
          Start →
        </Text>
      </View>
    </Pressable>
  );
}

const EXPLORE_CARDS = [
  {
    label: "For Beginners",
    subtitle: "First concert? Start here",
    bgLight: "#ECFDF5",
    bgDark: "rgba(6,78,59,0.2)",
    icon: "🌱",
    href: "/(tabs)/events",
  },
  {
    label: "Get a Rec",
    subtitle: "AI-picked just for you",
    bgLight: "#F5F3FF",
    bgDark: "rgba(76,29,149,0.2)",
    icon: "✨",
    href: "/(tabs)/chat",
  },
  {
    label: "Learn",
    subtitle: "Classical & jazz 101",
    bgLight: "#FFFBEB",
    bgDark: "rgba(120,53,15,0.2)",
    icon: "📖",
    href: "/(tabs)/learn",
  },
  {
    label: "My Badges",
    subtitle: "See what you've earned",
    bgLight: "#F0F9FF",
    bgDark: "rgba(12,74,110,0.2)",
    icon: "🏆",
    href: "/(tabs)/profile",
  },
] as const;

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const isDark = useColorScheme() === "dark";
  const { data: session } = authClient.useSession();
  const rawName = session?.user.name ?? "";
  const firstName =
    rawName.length > 0 ? (rawName.split(" ")[0] ?? "friend") : "friend";

  const { data: communityData, isPending: communityPending } = useQuery(
    trpc.event.all.queryOptions({}),
  );
  const { data: liveData, isPending: livePending } = useQuery(
    trpc.liveEvent.page.queryOptions({
      upcomingOnly: true,
      limit: 20,
      cursor: 0,
    }),
  );
  const { data: tasteProfile } = useQuery({
    ...trpc.tasteProfile.get.queryOptions(),
    enabled: !!session,
  });

  const loading = communityPending || livePending;
  const featured = loading
    ? []
    : mergeEvents(communityData ?? [], liveData?.items ?? []).slice(0, 4);

  const bg = isDark ? "#111111" : "#FFFAEF";
  const textPrimary = isDark ? "#F9FAFB" : "#111827";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ── */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 20,
            paddingBottom: 16,
            backgroundColor: isDark
              ? "rgba(120,53,15,0.08)"
              : "rgba(254,243,199,0.7)",
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: "#D97706",
              marginBottom: 4,
            }}
          >
            {session ? `Hey ${firstName} ~` : "Welcome to Classica"}
          </Text>
          <Text
            style={{
              fontSize: 24,
              fontWeight: "700",
              color: textPrimary,
              letterSpacing: -0.5,
            }}
          >
            {session
              ? "What shall we listen to today?"
              : "Your next favorite concert is waiting"}
          </Text>
          <Text style={{ fontSize: 14, color: "#6B7280", marginTop: 6 }}>
            Discover classical & jazz, powered by curiosity
          </Text>
        </View>

        {/* ── Ask Ton Ton (top priority) ── */}
        <View
          style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}
        >
          <Pressable onPress={() => router.push("/(tabs)/chat" as never)}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 16,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: isDark ? "#2D2D2D" : "#E5E7EB",
                backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF",
                padding: 14,
              }}
            >
              <View
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: 34,
                  overflow: "hidden",
                  backgroundColor: "#F5E6DC",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Image
                  source={tonTonAvatar}
                  style={{ width: 68, height: 68 }}
                  resizeMode="contain"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "600", color: textPrimary }}>
                  Ask Ton Ton
                </Text>
                <Text style={{ fontSize: 12, color: "#6B7280" }}>
                  Your musical sidekick — recs, trivia, anything!
                </Text>
              </View>
              <Text style={{ color: "#9CA3AF", fontSize: 18 }}>›</Text>
            </View>
          </Pressable>
        </View>

        {/* ── Onboarding / Taste Profile ── */}
        <View
          style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 }}
        >
          <OnboardingCTA
            session={!!session}
            tasteProfile={tasteProfile ?? null}
            isDark={isDark}
          />
        </View>

        {/* ── Upcoming Events ── */}
        <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Ionicons name="calendar-outline" size={20} color="#F59E0B" />
              <Text
                style={{ fontSize: 18, fontWeight: "600", color: textPrimary }}
              >
                Upcoming Events
              </Text>
            </View>
            <Pressable onPress={() => router.push("/(tabs)/events" as never)}>
              <Text
                style={{ fontSize: 14, fontWeight: "500", color: "#9C1738" }}
              >
                See all
              </Text>
            </Pressable>
          </View>
          {loading ? (
            <EventsSkeleton isDark={isDark} />
          ) : featured.length === 0 ? (
            <Text style={{ fontSize: 14, color: "#6B7280" }}>
              No upcoming events
            </Text>
          ) : (
            featured.map((row) => (
              <EventCard
                key={`${row.kind}-${row.event.id}`}
                row={row}
                isDark={isDark}
              />
            ))
          )}
        </View>

        {/* ── Explore ── */}
        <View style={{ paddingTop: 20 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              paddingHorizontal: 16,
              marginBottom: 12,
            }}
          >
            <Ionicons
              name="navigate-circle-outline"
              size={20}
              color="#F59E0B"
            />
            <Text
              style={{ fontSize: 18, fontWeight: "600", color: textPrimary }}
            >
              Explore
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
          >
            {EXPLORE_CARDS.map((card) => (
              <Pressable
                key={card.label}
                onPress={() => router.push(card.href as never)}
              >
                <View
                  style={{
                    width: 160,
                    height: 176,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: isDark ? "#2D2D2D" : "#E5E7EB",
                    backgroundColor: isDark ? card.bgDark : card.bgLight,
                    padding: 16,
                    gap: 12,
                  }}
                >
                  <Text style={{ fontSize: 32 }}>{card.icon}</Text>
                  <View>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: textPrimary,
                        lineHeight: 20,
                      }}
                    >
                      {card.label}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: "#6B7280",
                        marginTop: 4,
                        lineHeight: 16,
                      }}
                    >
                      {card.subtitle}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
