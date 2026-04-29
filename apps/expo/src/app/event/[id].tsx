import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";

import { trpc } from "~/utils/api";

const GENRE_LABELS: Record<string, string> = {
  orchestral: "Orchestral",
  opera: "Opera",
  chamber: "Chamber",
  solo_recital: "Solo Recital",
  choral: "Choral",
  ballet: "Ballet",
  jazz: "Jazz",
};

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string }> = {
  beginner: { bg: "#D1FAE5", text: "#065F46" },
  intermediate: { bg: "#FEF3C7", text: "#92400E" },
  advanced: { bg: "#FEE2E2", text: "#991B1B" },
};

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: "Beginner Friendly",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: event, isPending } = useQuery({
    ...trpc.event.byId.queryOptions({ id }),
    enabled: !!id,
  });

  if (isPending) {
    return (
      <SafeAreaView className="bg-background flex-1">
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted-foreground text-sm">Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView className="bg-background flex-1">
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-foreground text-lg font-semibold">
            Event not found
          </Text>
          <Pressable
            onPress={() => router.back()}
            className="mt-4 active:opacity-70"
          >
            <Text className="text-primary">Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const date = new Date(event.date);
  const when = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const fallbackDiff = DIFFICULTY_COLORS.beginner ?? {
    bg: "#D1FAE5",
    text: "#065F46",
  };
  const diffColors = DIFFICULTY_COLORS[event.difficulty] ?? fallbackDiff;
  const ticketUrl = event.ticketUrl;

  return (
    <SafeAreaView className="bg-background flex-1">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <Pressable
          onPress={() => router.back()}
          className="mx-4 mt-3 mb-2 flex-row items-center gap-1 active:opacity-60"
        >
          <Ionicons name="chevron-back" size={16} color="#9C1738" />
          <Text className="text-primary text-sm">Events</Text>
        </Pressable>

        {/* Hero image */}
        <View className="mx-4 mb-4 aspect-video overflow-hidden rounded-2xl bg-amber-100 dark:bg-amber-900/30">
          {event.imageUrl ? (
            <Image
              source={{ uri: event.imageUrl }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Text style={{ fontSize: 48 }}>🎵</Text>
            </View>
          )}
        </View>

        <View className="px-4">
          {/* Tags */}
          <View className="mb-3 flex-row flex-wrap gap-2">
            <View className="bg-muted rounded-full px-2.5 py-1">
              <Text className="text-foreground text-xs font-semibold">
                {GENRE_LABELS[event.genre] ?? event.genre}
              </Text>
            </View>
            <View
              className="rounded-full px-2.5 py-1"
              style={{ backgroundColor: diffColors.bg }}
            >
              <Text
                className="text-xs font-semibold"
                style={{ color: diffColors.text }}
              >
                {DIFFICULTY_LABELS[event.difficulty] ?? event.difficulty}
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text className="text-foreground mb-4 text-xl leading-snug font-bold">
            {event.title}
          </Text>

          {/* Date & venue */}
          <View className="mb-4 gap-2">
            <View className="flex-row items-start gap-2">
              <View className="mt-0.5">
                <Ionicons name="calendar-outline" size={16} color="#6B7280" />
              </View>
              <Text className="text-foreground flex-1 text-sm">{when}</Text>
            </View>
            <View className="flex-row items-start gap-2">
              <View className="mt-0.5">
                <Ionicons name="location-outline" size={16} color="#6B7280" />
              </View>
              <Text className="text-foreground flex-1 text-sm">
                {event.venue}
                {event.venueAddress ? `\n${event.venueAddress}` : ""}
              </Text>
            </View>
          </View>

          {/* Tickets */}
          {event.ticketUrl || !event.isFree ? (
            <View className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/30 dark:bg-emerald-950/20">
              <Text className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                {event.isFree
                  ? "Free event"
                  : `Tickets · $${(event.discountedPriceCents / 100).toFixed(2)}`}
              </Text>
              {ticketUrl ? (
                <Pressable
                  onPress={() => void Linking.openURL(ticketUrl)}
                  className="mt-3 items-center rounded-xl bg-[#9C1738] py-3 active:opacity-80"
                >
                  <Text className="text-sm font-semibold text-white">
                    Get Tickets
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : (
            <View className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/30 dark:bg-emerald-950/20">
              <Text className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                Free event
              </Text>
            </View>
          )}

          {/* Program */}
          <View className="mb-4">
            <Text className="text-foreground mb-2 text-base font-semibold">
              Program
            </Text>
            <View className="bg-card rounded-xl border p-3">
              <Text className="text-foreground text-sm leading-relaxed">
                {event.program}
              </Text>
            </View>
          </View>

          {/* Description */}
          {event.description ? (
            <View>
              <Text className="text-foreground mb-2 text-base font-semibold">
                About
              </Text>
              <Text className="text-muted-foreground text-sm leading-relaxed">
                {event.description}
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
