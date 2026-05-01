import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Share,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useMutation, useQuery } from "@tanstack/react-query";

import {
  COMPLETED_KEY,
  getLearningLevel,
  getStoredNumber,
  POINTS_KEY,
} from "@acme/validators";

import { trpc } from "~/utils/api";
import { authClient } from "~/utils/auth";
import { toSignInHref } from "~/utils/auth-redirect";
import bachBadgeImage from "../../../assets/badges/badge_bach_v2.png";
import classicalBadgeImage from "../../../assets/badges/badge_classical_v3.png";
import romanticBadgeImage from "../../../assets/badges/badge_romantic_v3.png";
import baroqueBadgeImage from "../../../assets/badges/baroque_badge.png";
import beethovenBadgeImage from "../../../assets/badges/beethoven_badge.png";
import chopinBadgeImage from "../../../assets/badges/chopin_badge.png";
import mozartBadgeImage from "../../../assets/badges/mozart_badge.png";

const BADGE_IMAGES: Record<string, number> = {
  beethoven: beethovenBadgeImage,
  mozart: mozartBadgeImage,
  bach: bachBadgeImage,
  chopin: chopinBadgeImage,
  baroque: baroqueBadgeImage,
  romantic: romanticBadgeImage,
  classical: classicalBadgeImage,
};

function NavCard({
  title,
  subtitle,
  onPress,
  emoji,
  isDark,
}: {
  title: string;
  subtitle: string;
  onPress: () => void;
  emoji: string;
  isDark: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        borderRadius: 14,
        borderWidth: 1,
        borderColor: isDark ? "#2D2D2D" : "#E5E7EB",
        backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF",
        padding: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
      }}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 19,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: isDark ? "rgba(6,78,59,0.25)" : "#D1FAE5",
        }}
      >
        <Text style={{ fontSize: 18 }}>{emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: isDark ? "#F9FAFB" : "#111827",
            fontSize: 14,
            fontWeight: "600",
          }}
        >
          {title}
        </Text>
        <Text style={{ marginTop: 2, color: "#6B7280", fontSize: 12 }}>
          {subtitle}
        </Text>
      </View>
      <Text style={{ color: "#9CA3AF", fontSize: 18 }}>›</Text>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const isDark = useColorScheme() === "dark";
  const { data: session } = authClient.useSession();
  const userName = session?.user.name ?? "Guest";
  const isSignedIn = !!session?.user;

  const { data: tasteProfile } = useQuery({
    ...trpc.tasteProfile.get.queryOptions(),
    enabled: isSignedIn,
  });
  const { data: userEvents } = useQuery({
    ...trpc.userEvent.myEvents.queryOptions(),
    enabled: isSignedIn,
  });
  const { data: orders } = useQuery({
    ...trpc.ticket.myOrders.queryOptions(),
    enabled: isSignedIn,
  });
  const { data: badges } = useQuery({
    ...trpc.badges.forUser.queryOptions(),
    enabled: isSignedIn,
  });
  const [activeBadgeId, setActiveBadgeId] = useState<string | null>(null);
  const [learningPoints, setLearningPoints] = useState(0);

  useEffect(() => {
    void (async () => {
      const [pointsRaw, completedRaw] = await Promise.all([
        SecureStore.getItemAsync(POINTS_KEY),
        SecureStore.getItemAsync(COMPLETED_KEY),
      ]);
      setLearningPoints(getStoredNumber(pointsRaw));
      void completedRaw;
    })();
  }, []);
  const activeBadge =
    badges?.find((badge) => badge.id === activeBadgeId) ?? null;

  const signOut = useMutation({
    mutationFn: async () => {
      await authClient.signOut();
    },
    onSuccess: () => {
      router.replace("/(tabs)");
    },
    onError: (error) => {
      const message =
        error instanceof Error
          ? error.message
          : "Could not sign out right now.";
      Alert.alert("Sign out failed", message);
    },
  });

  const attendedCount =
    userEvents?.filter((event) => event.status === "attended").length ?? 0;

  // Days on app from first attended event
  const firstEvent = userEvents?.find((e) => e.status === "attended");
  const createdAt = firstEvent ? new Date(firstEvent.createdAt) : undefined;
  const [asOf] = useState(() => Date.now());
  const daysOnApp = createdAt
    ? Math.max(1, Math.floor((asOf - createdAt.getTime()) / 86_400_000))
    : 0;

  const {
    current: learningLevel,
    currentIndex,
    next: nextLevel,
  } = getLearningLevel(learningPoints);
  const levelNumber = currentIndex + 1;
  const xpIntoLevel = learningPoints - learningLevel.min;
  const xpForNext = nextLevel ? nextLevel.min - learningLevel.min : 0;
  const levelPct = nextLevel
    ? Math.round((xpIntoLevel / xpForNext) * 100)
    : 100;

  const quests = [
    {
      id: "concerts",
      icon: "🎟️",
      title: "Concert Explorer",
      subtitle: "Attend concerts to sharpen your profile",
      progress: attendedCount,
      target: 1,
      reward: 30,
      href: "/(tabs)/events" as const,
      cta: "Find concerts",
      color: "#BE123C",
      bgColor: isDark ? "rgba(190,18,60,0.12)" : "#FFF1F2",
      borderColor: isDark ? "rgba(190,18,60,0.3)" : "#FFE4E6",
    },
    {
      id: "quizzes",
      icon: "🧠",
      title: "Quiz Collector",
      subtitle: "Complete Learn quizzes to earn XP",
      progress: 0,
      target: 5,
      reward: 25,
      href: "/(tabs)/learn" as const,
      cta: "Continue learning",
      color: "#7C3AED",
      bgColor: isDark ? "rgba(124,58,237,0.12)" : "#F5F3FF",
      borderColor: isDark ? "rgba(124,58,237,0.3)" : "#EDE9FE",
    },
  ] as const;

  const bg = isDark ? "#111111" : "#FFFAEF";
  const cardBg = isDark ? "#1A1A1A" : "#FFFFFF";
  const border = isDark ? "#2D2D2D" : "#E5E7EB";
  const textPrimary = isDark ? "#F9FAFB" : "#111827";
  const textMuted = "#6B7280";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profile card ── */}
        <View
          style={{
            marginHorizontal: 16,
            marginTop: 16,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: border,
            backgroundColor: cardBg,
            overflow: "hidden",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
            elevation: 3,
          }}
        >
          {/* Gradient banner */}
          <View style={{ height: 72, backgroundColor: "#9C1738" }} />

          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            {/* Avatar + stats row */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginTop: -36,
                marginBottom: 12,
              }}
            >
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#F8E8EE",
                  borderWidth: 3,
                  borderColor: cardBg,
                }}
              >
                <Text style={{ fontSize: 30 }}>
                  {tasteProfile?.badgeEmoji ?? "🎵"}
                </Text>
              </View>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 44 }}>
                <View
                  style={{
                    alignItems: "center",
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: border,
                    backgroundColor: cardBg,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    minWidth: 68,
                  }}
                >
                  <Text style={{ fontSize: 10, color: textMuted }}>
                    🎵 Concerts
                  </Text>
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: "700",
                      color: textPrimary,
                      marginTop: 2,
                    }}
                  >
                    {attendedCount}
                  </Text>
                </View>
                <View
                  style={{
                    alignItems: "center",
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: border,
                    backgroundColor: cardBg,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    minWidth: 68,
                  }}
                >
                  <Text style={{ fontSize: 10, color: textMuted }}>
                    🔥 Streak
                  </Text>
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: "700",
                      color: textPrimary,
                      marginTop: 2,
                    }}
                  >
                    {daysOnApp}
                  </Text>
                </View>
              </View>
            </View>

            {/* Name + level */}
            <Text
              style={{ fontSize: 20, fontWeight: "700", color: textPrimary }}
            >
              {userName}
            </Text>
            <Text style={{ fontSize: 12, color: textMuted, marginTop: 2 }}>
              {learningLevel.name}
            </Text>

            {/* Sign out */}
            {isSignedIn && (
              <Pressable
                disabled={signOut.isPending}
                onPress={() => signOut.mutate()}
                style={{
                  marginTop: 8,
                  alignSelf: "flex-start",
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: border,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                }}
              >
                <Text
                  style={{
                    color: textPrimary,
                    fontSize: 11,
                    fontWeight: "600",
                  }}
                >
                  {signOut.isPending ? "Signing out..." : "Sign out"}
                </Text>
              </Pressable>
            )}

            {!isSignedIn && (
              <Pressable
                onPress={() => router.push(toSignInHref("/(tabs)/profile"))}
                style={{
                  marginTop: 10,
                  borderRadius: 10,
                  backgroundColor: "#9C1738",
                  paddingVertical: 10,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "600" }}
                >
                  Sign in
                </Text>
              </Pressable>
            )}

            {/* XP progress bar */}
            <View
              style={{
                marginTop: 16,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: isDark ? "rgba(251,191,36,0.2)" : "#FDE68A",
                backgroundColor: isDark
                  ? "rgba(120,53,15,0.15)"
                  : "rgba(255,251,235,0.9)",
                padding: 14,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: textPrimary,
                  }}
                >
                  ✨ LV {levelNumber} · {learningLevel.name}
                </Text>
                <Text style={{ fontSize: 11, color: textMuted }}>
                  {nextLevel
                    ? `${xpIntoLevel}/${xpForNext} XP`
                    : `${learningPoints} XP`}
                </Text>
              </View>
              <View
                style={{
                  height: 8,
                  borderRadius: 999,
                  backgroundColor: isDark ? "#2D2D2D" : "#F3F4F6",
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    height: "100%",
                    borderRadius: 999,
                    width: `${levelPct}%`,
                    backgroundColor: "#F59E0B",
                  }}
                />
              </View>
              <Text style={{ fontSize: 10, color: textMuted, marginTop: 6 }}>
                {nextLevel
                  ? `${Math.max(0, xpForNext - xpIntoLevel)} XP left to reach LV ${levelNumber + 1} ${nextLevel.name}`
                  : "You have unlocked every learning level."}
              </Text>
            </View>

            {/* Divider */}
            <View
              style={{ height: 1, backgroundColor: border, marginVertical: 16 }}
            />

            {/* Daily quests */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginBottom: 4,
              }}
            >
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isDark ? "rgba(190,18,60,0.2)" : "#FFE4E6",
                }}
              >
                <Text style={{ fontSize: 14 }}>🎯</Text>
              </View>
              <Text
                style={{ fontSize: 15, fontWeight: "700", color: textPrimary }}
              >
                Daily quests
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: textMuted, marginBottom: 12 }}>
              Complete these to earn points and level up.
            </Text>

            {quests.map((quest) => {
              const clamped = Math.min(quest.progress, quest.target);
              const pct = Math.round((clamped / quest.target) * 100);
              const done = quest.progress >= quest.target;
              return (
                <Pressable
                  key={quest.id}
                  onPress={() => router.push(quest.href as never)}
                  style={{
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: quest.borderColor,
                    backgroundColor: quest.bgColor,
                    padding: 14,
                    marginBottom: 10,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <View style={{ flexDirection: "row", gap: 12, flex: 1 }}>
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: quest.borderColor,
                          flexShrink: 0,
                        }}
                      >
                        <Text style={{ fontSize: 16 }}>{quest.icon}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: "600",
                            color: textPrimary,
                          }}
                        >
                          {quest.title}
                        </Text>
                        <Text
                          style={{
                            fontSize: 11,
                            color: textMuted,
                            marginTop: 2,
                          }}
                        >
                          {quest.subtitle}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={{
                        borderRadius: 999,
                        backgroundColor: quest.color,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        alignSelf: "flex-start",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: "700",
                          color: "#FFFFFF",
                        }}
                      >
                        +{quest.reward} XP
                      </Text>
                    </View>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginTop: 10,
                    }}
                  >
                    <Text style={{ fontSize: 11, color: textMuted }}>
                      {clamped}/{quest.target} complete
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "600",
                        color: textPrimary,
                      }}
                    >
                      {done ? "✓ Completed" : quest.cta}
                    </Text>
                  </View>
                  <View
                    style={{
                      height: 6,
                      borderRadius: 999,
                      backgroundColor: isDark ? "#2D2D2D" : "rgba(0,0,0,0.08)",
                      overflow: "hidden",
                      marginTop: 6,
                    }}
                  >
                    <View
                      style={{
                        height: "100%",
                        borderRadius: 999,
                        width: `${pct}%`,
                        backgroundColor: quest.color,
                      }}
                    />
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── Quick-links ── */}
        <View style={{ marginHorizontal: 16, marginTop: 12, gap: 10 }}>
          <NavCard
            isDark={isDark}
            emoji="🎵"
            title={tasteProfile?.archetype ?? "Your taste"}
            subtitle={
              tasteProfile?.archetype
                ? (tasteProfile.tags ?? []).slice(0, 3).join(" · ") ||
                  "Your archetype, dimensions, and sound profile"
                : "Your archetype, dimensions, and sound profile"
            }
            onPress={() =>
              isSignedIn
                ? router.push("/profile/taste")
                : router.push(toSignInHref("/profile/taste"))
            }
          />
          <NavCard
            isDark={isDark}
            emoji="🎫"
            title="My tickets"
            subtitle={`${orders?.length ?? 0} ticket order${(orders?.length ?? 0) === 1 ? "" : "s"}`}
            onPress={() =>
              isSignedIn
                ? router.push("/tickets")
                : router.push(toSignInHref("/tickets"))
            }
          />
          <NavCard
            isDark={isDark}
            emoji="🧭"
            title="Retake taste quiz"
            subtitle="Refresh your archetype and recommendations"
            onPress={() =>
              isSignedIn
                ? router.push({
                    pathname: "/onboarding/taste",
                    params: { restart: "1" },
                  })
                : router.push(toSignInHref("/onboarding/taste"))
            }
          />
        </View>

        {/* ── Badges ── */}
        <Text
          style={{
            marginTop: 24,
            marginBottom: 4,
            paddingHorizontal: 16,
            color: textPrimary,
            fontSize: 18,
            fontWeight: "700",
          }}
        >
          Badges
        </Text>
        <Text
          style={{
            paddingHorizontal: 16,
            marginBottom: 12,
            color: textMuted,
            fontSize: 12,
          }}
        >
          Earn badges by attending concerts and listening to music.
        </Text>
        <View style={{ paddingHorizontal: 16, gap: 10 }}>
          {(badges ?? []).map((badge) => (
            <Pressable
              key={badge.id}
              onPress={() => setActiveBadgeId(badge.id)}
              style={{
                borderRadius: 12,
                borderWidth: 1,
                borderColor: border,
                backgroundColor: cardBg,
                padding: 12,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 27,
                  borderWidth: 2,
                  borderColor: "#DCBB7D",
                  overflow: "hidden",
                }}
              >
                <Image
                  source={BADGE_IMAGES[badge.imageKey] ?? bachBadgeImage}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: textPrimary,
                    fontSize: 14,
                    fontWeight: "600",
                  }}
                >
                  {badge.label}
                </Text>
                <Text style={{ color: textMuted, fontSize: 12, marginTop: 2 }}>
                  {badge.earned ? badge.achievement : badge.requirementText}
                </Text>
              </View>
              <Text
                style={{
                  color: badge.earned ? "#047857" : "#9CA3AF",
                  fontSize: 11,
                }}
              >
                {badge.earned ? "Unlocked" : "Locked"}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <Modal visible={!!activeBadge} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.55)",
            justifyContent: "center",
            paddingHorizontal: 20,
          }}
        >
          {activeBadge ? (
            <View
              style={{
                borderRadius: 18,
                borderWidth: 1,
                borderColor: border,
                backgroundColor: cardBg,
                padding: 18,
                alignItems: "center",
              }}
            >
              <Image
                source={BADGE_IMAGES[activeBadge.imageKey] ?? bachBadgeImage}
                style={{ width: 116, height: 116, borderRadius: 58 }}
                resizeMode="cover"
              />
              <Text
                style={{
                  marginTop: 12,
                  color: textPrimary,
                  fontSize: 20,
                  fontWeight: "700",
                  textAlign: "center",
                }}
              >
                {activeBadge.label}
              </Text>
              <Text
                style={{
                  marginTop: 8,
                  color: textMuted,
                  fontSize: 13,
                  textAlign: "center",
                  lineHeight: 20,
                }}
              >
                {activeBadge.earned
                  ? activeBadge.achievement
                  : activeBadge.requirementText}
              </Text>

              {activeBadge.earned ? (
                <Pressable
                  onPress={async () => {
                    await Share.share({
                      message: `I just unlocked "${activeBadge.label}" on Classica.`,
                    });
                  }}
                  style={{
                    marginTop: 12,
                    borderRadius: 10,
                    backgroundColor: "#9C1738",
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                  }}
                >
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontWeight: "600",
                      fontSize: 13,
                    }}
                  >
                    Share badge
                  </Text>
                </Pressable>
              ) : null}

              <Pressable
                onPress={() => setActiveBadgeId(null)}
                style={{ marginTop: 12 }}
              >
                <Text
                  style={{ color: "#9C1738", fontWeight: "600", fontSize: 13 }}
                >
                  Close
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </Modal>
    </SafeAreaView>
  );
}
