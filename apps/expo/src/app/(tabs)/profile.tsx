import { useCallback, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const STATS = [
  { value: "24", label: "Concerts Attended" },
  { value: "142", label: "Days on the App" },
  { value: "1,280", label: "Live Pieces Listened" },
];

const BADGE_IMAGES = {
  beethoven: require("../../../assets/badges/beethoven_badge.png") as number,
  mozart: require("../../../assets/badges/mozart_badge.png") as number,
  chopin: require("../../../assets/badges/chopin_badge.png") as number,
  baroque: require("../../../assets/badges/baroque_badge.png") as number,
  romantic: require("../../../assets/badges/badge_romantic_v3.png") as number,
  classical: require("../../../assets/badges/badge_classical_v3.png") as number,
  bach: require("../../../assets/badges/badge_bach_v2.png") as number,
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
  isFlipped,
  onFlip,
}: {
  badge: BadgeData;
  isFlipped: boolean;
  onFlip: () => void;
}) {
  const rotation = useSharedValue(0);
  const lastFlipped = useRef(false);

  if (isFlipped !== lastFlipped.current) {
    lastFlipped.current = isFlipped;
    rotation.value = withTiming(isFlipped ? 180 : 0, { duration: 700 });
  }

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
    </Pressable>
  );
}

export default function ProfileScreen() {
  const [flippedIds, setFlippedIds] = useState<Set<string>>(new Set());

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

  return (
    <SafeAreaView className="bg-background flex-1">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
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
                Billy
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
        <Text className="text-muted-foreground mb-4 px-5 text-xs">
          Tap a badge to flip it
        </Text>
        <View className="flex-row flex-wrap justify-between px-5">
          {BADGES.map((badge) => (
            <BadgeCard
              key={badge.id}
              badge={badge}
              isFlipped={flippedIds.has(badge.id)}
              onFlip={() => toggleFlip(badge.id)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
