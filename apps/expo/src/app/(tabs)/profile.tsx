import type { Href } from "expo-router";
import { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Share,
  Text,
  useColorScheme,
  View,
} from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { useNavigation, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";

import { authClient } from "~/utils/auth";
import bachBadgeImage from "../../../assets/badges/badge_bach_v2.png";
import classicalBadgeImage from "../../../assets/badges/badge_classical_v3.png";
import romanticBadgeImage from "../../../assets/badges/badge_romantic_v3.png";
import baroqueBadgeImage from "../../../assets/badges/baroque_badge.png";
import beethovenBadgeImage from "../../../assets/badges/beethoven_badge.png";
import chopinBadgeImage from "../../../assets/badges/chopin_badge.png";
import mozartBadgeImage from "../../../assets/badges/mozart_badge.png";

const STATS = [
  { value: "24", label: "Concerts Attended" },
  { value: "142", label: "Days on the App" },
  { value: "1,280", label: "Live Pieces Listened" },
];

const BADGE_IMAGES = {
  beethoven: beethovenBadgeImage,
  mozart: mozartBadgeImage,
  chopin: chopinBadgeImage,
  baroque: baroqueBadgeImage,
  romantic: romanticBadgeImage,
  classical: classicalBadgeImage,
  bach: bachBadgeImage,
};

interface BadgeData {
  id: string;
  label: string;
  image: number;
  dateEarned: string;
  achievement: string;
}

const BADGES: BadgeData[] = [
  {
    id: "beethoven",
    label: "Beethoven\nLover",
    image: BADGE_IMAGES.beethoven,
    dateEarned: "Jan 12, 2026",
    achievement: "Attended 3 concerts featuring Beethoven pieces",
  },
  {
    id: "mozart",
    label: "Mozart\nLover",
    image: BADGE_IMAGES.mozart,
    dateEarned: "Feb 3, 2026",
    achievement: "Attended 3 concerts featuring Mozart pieces",
  },
  {
    id: "bach",
    label: "Bach\nLover",
    image: BADGE_IMAGES.bach,
    dateEarned: "Feb 18, 2026",
    achievement: "Attended 3 concerts featuring Bach pieces",
  },
  {
    id: "chopin",
    label: "Chopin\nLover",
    image: BADGE_IMAGES.chopin,
    dateEarned: "Dec 5, 2025",
    achievement: "Attended 3 concerts featuring Chopin pieces",
  },
  {
    id: "baroque",
    label: "Baroque Era\nEnthusiast",
    image: BADGE_IMAGES.baroque,
    dateEarned: "Nov 20, 2025",
    achievement: "Listened to 10 pieces written in the Baroque era",
  },
  {
    id: "romantic",
    label: "Romantic Era\nEnthusiast",
    image: BADGE_IMAGES.romantic,
    dateEarned: "Jan 28, 2026",
    achievement: "Listened to 10 pieces written in the Romantic era",
  },
  {
    id: "classical",
    label: "Classical Era\nEnthusiast",
    image: BADGE_IMAGES.classical,
    dateEarned: "Feb 10, 2026",
    achievement: "Listened to 10 pieces written in the Classical era",
  },
];

function lockedRequirementText(input: { achievement: string }): string {
  const text = input.achievement.trim();
  if (text.startsWith("Attended ")) {
    return `Attend ${text.slice("Attended ".length)} to unlock this badge.`;
  }
  if (text.startsWith("Listened to ")) {
    return `Listen to ${text.slice("Listened to ".length)} to unlock this badge.`;
  }
  return "Complete requirements to unlock this badge.";
}

const cardShadow = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 12,
  elevation: 3,
};

const screenWidth = Dimensions.get("window").width;
const badgeCardWidth = (screenWidth - 20 * 2 - 14) / 2;

function BadgeCard({
  badge,
  earned,
  isFlipped,
  onFlip,
}: {
  badge: BadgeData;
  earned: boolean;
  isFlipped: boolean;
  onFlip: () => void;
}) {
  const rotation = useSharedValue(0);
  useEffect(() => {
    rotation.value = withTiming(isFlipped ? 180 : 0, { duration: 700 });
  }, [isFlipped, rotation]);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 800 },
      { rotateY: `${interpolate(rotation.value, [0, 180], [0, 180])}deg` },
    ],
    backfaceVisibility: "hidden" as const,
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 800 },
      { rotateY: `${interpolate(rotation.value, [0, 180], [180, 360])}deg` },
    ],
    backfaceVisibility: "hidden" as const,
  }));

  return (
    <Pressable
      onPress={onFlip}
      style={[cardShadow, { width: badgeCardWidth, marginBottom: 14 }]}
      className="bg-card items-center rounded-2xl pt-5 pb-4"
    >
      <View style={{ width: 116, height: 116 }}>
        {/* Front */}
        <Animated.View
          style={[
            frontStyle,
            { position: "absolute", width: 116, height: 116 },
          ]}
        >
          <View
            style={{
              width: 116,
              height: 116,
              borderRadius: 58,
              borderWidth: 3,
              borderColor: "#DCBB7D",
              overflow: "hidden",
            }}
          >
            <Image
              source={badge.image}
              style={{ width: 110, height: 110, borderRadius: 55 }}
              resizeMode="cover"
            />
          </View>
          <View
            style={{
              position: "absolute",
              top: 8,
              right: 12,
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: "rgba(255,255,255,0.9)",
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: 16,
              left: 10,
              width: 5,
              height: 5,
              borderRadius: 2.5,
              backgroundColor: "rgba(255,255,255,0.7)",
            }}
          />
        </Animated.View>

        {/* Back */}
        <Animated.View
          style={[
            backStyle,
            {
              position: "absolute",
              width: 116,
              height: 116,
              borderRadius: 58,
              backgroundColor: "#DCBB7D",
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
            },
          ]}
        >
          {/* Glare streak top-left */}
          <View
            style={{
              position: "absolute",
              top: 10,
              left: 14,
              width: 28,
              height: 6,
              backgroundColor: "rgba(255,255,255,0.35)",
              borderRadius: 3,
              transform: [{ rotate: "-40deg" }],
            }}
          />
          {/* Glare dot top-right */}
          <View
            style={{
              position: "absolute",
              top: 18,
              right: 20,
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: "rgba(255,255,255,0.4)",
            }}
          />
          {/* Glare arc bottom */}
          <View
            style={{
              position: "absolute",
              bottom: 8,
              right: 24,
              width: 20,
              height: 4,
              backgroundColor: "rgba(255,255,255,0.25)",
              borderRadius: 2,
              transform: [{ rotate: "30deg" }],
            }}
          />
          <Text
            style={{
              color: "#4A3820",
              fontSize: 10,
              fontWeight: "700",
              textAlign: "center",
              lineHeight: 14,
            }}
          >
            {badge.achievement}
          </Text>
          <View
            style={{
              width: 30,
              height: 1,
              backgroundColor: "#A8894D",
              marginVertical: 6,
              borderRadius: 1,
            }}
          />
          <Text
            style={{
              color: "#5C4428",
              fontSize: 9,
              fontWeight: "600",
              textAlign: "center",
            }}
          >
            {badge.dateEarned}
          </Text>
        </Animated.View>
      </View>

      <Text className="text-foreground mt-3 text-center text-sm font-semibold">
        {badge.label}
      </Text>
      {!earned && (
        <Text className="text-muted-foreground mt-1 text-center text-[10px] uppercase">
          Locked
        </Text>
      )}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const { data: session } = authClient.useSession();
  const name = session?.user.name ?? "Guest";
  const [flippedIds, setFlippedIds] = useState<Set<string>>(new Set());
  const [newlyEarnedBadgeId, setNewlyEarnedBadgeId] = useState<string | null>(
    null,
  );
  const [previewBadgeId, setPreviewBadgeId] = useState<string | null>(null);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [overlayFlipped, setOverlayFlipped] = useState(false);
  const popupScale = useSharedValue(0.92);
  const popupOpacity = useSharedValue(0);
  const badgeRotation = useSharedValue(0);
  const overlayFlipRotation = useSharedValue(0);

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

  useEffect(() => {
    const userId = session?.user.id;
    if (!userId) return;

    let cancelled = false;
    const storageKey = `classica-earned-badges:${userId}`;
    const earnedNow = BADGES.filter((b) => b.id === "bach").map((b) => b.id);

    const checkNewlyEarned = async () => {
      const prevRaw = await SecureStore.getItemAsync(storageKey);
      const prev = prevRaw ? (JSON.parse(prevRaw) as string[]) : [];
      const newlyEarned = earnedNow.find((id) => !prev.includes(id));

      if (!cancelled && newlyEarned) {
        setNewlyEarnedBadgeId(newlyEarned);
        setShareFeedback(null);
      }

      await SecureStore.setItemAsync(storageKey, JSON.stringify(earnedNow));
    };

    void checkNewlyEarned();
    return () => {
      cancelled = true;
    };
  }, [session?.user.id]);

  const overlayBadgeId = newlyEarnedBadgeId ?? previewBadgeId;
  const isUnlockOverlay = newlyEarnedBadgeId != null;
  const overlayBadge =
    BADGES.find((badge) => badge.id === overlayBadgeId) ?? null;
  const overlayBadgeIsUnlocked = overlayBadge?.id === "bach";

  useEffect(() => {
    if (!overlayBadgeId) return;
    popupScale.value = 0.92;
    popupOpacity.value = 0;
    popupScale.value = withSpring(1, { damping: 15, stiffness: 180 });
    popupOpacity.value = withTiming(1, { duration: 220 });
    overlayFlipRotation.value = 0;
  }, [overlayBadgeId, popupOpacity, popupScale]);

  useEffect(() => {
    if (!overlayBadgeId) return;
    const base = isUnlockOverlay ? 360 : 0;
    const target = base + (overlayBadgeIsUnlocked && overlayFlipped ? 180 : 0);
    badgeRotation.value = withTiming(target, {
      duration: isUnlockOverlay && !overlayFlipped ? 1200 : 700,
    });
  }, [
    badgeRotation,
    isUnlockOverlay,
    overlayBadgeId,
    overlayBadgeIsUnlocked,
    overlayFlipped,
  ]);

  useEffect(() => {
    if (!overlayBadgeId) return;
    overlayFlipRotation.value = withTiming(
      overlayBadgeIsUnlocked && overlayFlipped ? 180 : 0,
      {
        duration: 700,
      },
    );
  }, [
    overlayBadgeId,
    overlayBadgeIsUnlocked,
    overlayFlipRotation,
    overlayFlipped,
  ]);
  const popupStyle = useAnimatedStyle(() => ({
    transform: [{ scale: popupScale.value }],
    opacity: popupOpacity.value,
  }));
  const badgeSpinStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 900 }, { rotateY: `${badgeRotation.value}deg` }],
  }));
  const overlayFrontStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 900 },
      {
        rotateY: `${interpolate(overlayFlipRotation.value, [0, 180], [0, 180])}deg`,
      },
    ],
    backfaceVisibility: "hidden" as const,
  }));
  const overlayBackStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 900 },
      {
        rotateY: `${interpolate(overlayFlipRotation.value, [0, 180], [180, 360])}deg`,
      },
    ],
    backfaceVisibility: "hidden" as const,
  }));

  const handleShareBadge = async () => {
    if (!overlayBadge) return;
    const message = `I just earned the "${overlayBadge.label.replace("\n", " ")}" badge on Classica! https://www.getclassica.com`;

    try {
      await Share.share({
        message,
      });
      setShareFeedback("Shared!");
    } catch {
      setShareFeedback("Could not share right now.");
    }
  };

  const openBadgeOverlay = (badgeId: string) => {
    setPreviewBadgeId(badgeId);
    setOverlayFlipped(false);
    setShareFeedback(null);
  };

  const closeBadgeOverlay = () => {
    setNewlyEarnedBadgeId(null);
    setPreviewBadgeId(null);
    setOverlayFlipped(false);
  };

  useEffect(() => {
    const parent = navigation.getParent();
    if (!parent) return;
    const isDark = colorScheme === "dark";

    parent.setOptions({
      tabBarStyle: overlayBadgeId
        ? { display: "none" }
        : {
            backgroundColor: isDark ? "#111" : "#FFFFFF",
            borderTopColor: isDark ? "#222" : "#F0F0F0",
            height: 88,
            paddingBottom: 28,
            paddingTop: 8,
          },
    });
  }, [colorScheme, navigation, overlayBadgeId]);

  return (
    <SafeAreaView className="bg-background flex-1">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!overlayBadge}
      >
        <Text className="text-foreground mt-4 px-5 text-3xl font-bold">
          Profile
        </Text>

        <View className="bg-card mx-5 mt-5 rounded-2xl p-6" style={cardShadow}>
          <View className="flex-row">
            <View className="mr-6 items-center">
              <View
                className="h-28 w-28 items-center justify-center overflow-hidden rounded-full"
                style={{ backgroundColor: "#F8E8EE" }}
              >
                <Text style={{ fontSize: 48 }}>🎵</Text>
              </View>
              <Text className="text-foreground mt-3 text-xl font-bold">
                {name}
              </Text>
            </View>

            <View className="flex-1 justify-center">
              {STATS.map((stat, index) => (
                <View key={stat.label}>
                  <View className="py-2.5">
                    <Text className="text-foreground text-2xl font-bold">
                      {stat.value}
                    </Text>
                    <Text className="text-muted-foreground text-xs">
                      {stat.label}
                    </Text>
                  </View>
                  {index < STATS.length - 1 && (
                    <View className="bg-border h-px" />
                  )}
                </View>
              ))}
            </View>
          </View>
        </View>

        <Text className="text-foreground mt-8 px-5 text-xl font-bold">
          Badges
        </Text>
        <View className="px-5 pt-4">
          <Pressable
            className="items-center rounded-xl bg-[#9C1738] px-4 py-3"
            onPress={() => router.push("/waitlist" as Href)}
          >
            <Text className="text-base font-semibold text-white">
              Join Waitlist
            </Text>
          </Pressable>
        </View>
        <Text className="text-muted-foreground mb-4 px-5 text-xs">
          Tap a badge to flip it
        </Text>
        <View className="flex-row flex-wrap justify-between px-5">
          {BADGES.map((badge) => (
            <BadgeCard
              key={badge.id}
              badge={badge}
              earned={badge.id === "bach"}
              isFlipped={flippedIds.has(badge.id)}
              onFlip={() => openBadgeOverlay(badge.id)}
            />
          ))}
        </View>
      </ScrollView>

      <Modal
        visible={!!overlayBadge}
        transparent
        animationType="none"
        statusBarTranslucent
        presentationStyle="overFullScreen"
      >
        <View className="flex-1">
          <BlurView
            intensity={40}
            tint="dark"
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
            }}
          />
          <View className="absolute inset-0 bg-black/45" />
          {overlayBadge ? (
            <Animated.View
              style={[popupStyle, { flex: 1 }]}
              className="items-center justify-center px-6"
            >
              <Pressable
                className="absolute top-44 right-6 z-10 h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/25"
                onPress={closeBadgeOverlay}
              >
                <Text className="text-center text-2xl leading-7 text-white">
                  ×
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (!overlayBadgeIsUnlocked) return;
                  setOverlayFlipped((v) => !v);
                }}
                className="relative mb-4 h-36 w-36"
              >
                <Animated.View
                  style={badgeSpinStyle}
                  className="h-36 w-36 items-center justify-center"
                >
                  <Animated.View
                    style={overlayFrontStyle}
                    className="absolute h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-amber-300 bg-zinc-900"
                  >
                    <Image
                      source={overlayBadge.image}
                      style={{ width: 128, height: 128, borderRadius: 64 }}
                      resizeMode="cover"
                    />
                  </Animated.View>
                  <Animated.View
                    style={overlayBackStyle}
                    className="absolute h-32 w-32 items-center justify-center rounded-full border-4 border-amber-300 bg-[#DCBB7D] px-4"
                  >
                    <Text className="text-center text-[11px] leading-4 font-semibold text-[#4A3820]">
                      {overlayBadgeIsUnlocked
                        ? overlayBadge.achievement
                        : lockedRequirementText(overlayBadge)}
                    </Text>
                  </Animated.View>
                </Animated.View>
              </Pressable>

              <Text className="text-xs font-semibold tracking-[2px] text-amber-300 uppercase">
                {overlayBadgeIsUnlocked ? "New Badge Unlocked" : "Badge Locked"}
              </Text>
              <Text className="mt-2 text-center text-3xl font-bold text-white">
                {overlayBadge.label}
              </Text>
              <Text className="mt-2 max-w-sm text-center text-sm text-zinc-200">
                {overlayBadgeIsUnlocked
                  ? overlayBadge.achievement
                  : lockedRequirementText(overlayBadge)}
              </Text>
              {overlayBadgeIsUnlocked ? (
                <Text className="mt-2 text-xs text-zinc-300">
                  Tap badge to flip
                </Text>
              ) : null}

              <View className="mt-8 w-full max-w-sm">
                {overlayBadgeIsUnlocked ? (
                  <Pressable
                    className="w-full items-center rounded-xl bg-[#9C1738] px-4 py-3"
                    onPress={handleShareBadge}
                  >
                    <Text className="text-sm font-semibold text-white">
                      Share Badge
                    </Text>
                  </Pressable>
                ) : null}
              </View>

              {shareFeedback && (
                <Text className="mt-3 text-xs text-zinc-300">
                  {shareFeedback}
                </Text>
              )}
            </Animated.View>
          ) : null}
        </View>
      </Modal>
    </SafeAreaView>
  );
}
