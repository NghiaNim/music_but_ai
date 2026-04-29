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

const VENUE_FULL: Record<string, string> = {
  msm: "Manhattan School of Music",
  juilliard: "Juilliard",
  met_opera: "Metropolitan Opera",
  carnegie_hall: "Carnegie Hall",
  ny_phil: "New York Philharmonic",
  nycballet: "New York City Ballet",
};

function formatDate(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return "Date to be announced";
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return String(dateInput);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function LiveEventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: event, isPending } = useQuery({
    ...trpc.liveEvent.byId.queryOptions({ id }),
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

  const sourceLabel = VENUE_FULL[event.source] ?? event.source;
  const when = formatDate(event.date ?? event.dateText);
  const venueLine = [event.venueName, event.location]
    .filter(Boolean)
    .join(" · ");

  return (
    <SafeAreaView className="bg-background flex-1">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Back button */}
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
            <View className="rounded-full bg-sky-100 px-2.5 py-1 dark:bg-sky-900/30">
              <Text className="text-xs font-semibold text-sky-700 dark:text-sky-300">
                {sourceLabel}
              </Text>
            </View>
            <View className="bg-muted rounded-full px-2.5 py-1">
              <Text className="text-foreground text-xs font-semibold">
                {GENRE_LABELS[event.genre] ?? event.genre}
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
            {venueLine ? (
              <View className="flex-row items-start gap-2">
                <View className="mt-0.5">
                  <Ionicons name="location-outline" size={16} color="#6B7280" />
                </View>
                <Text className="text-foreground flex-1 text-sm">
                  {venueLine}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Tickets */}
          <View className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/30 dark:bg-emerald-950/20">
            <Text className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              Tickets & details
            </Text>
            <Text className="text-muted-foreground mt-1 text-xs">
              Availability and pricing are handled on the venue's website.
            </Text>
            <Pressable
              onPress={() => void Linking.openURL(event.buyUrl)}
              className="mt-3 items-center rounded-xl bg-[#9C1738] py-3 active:opacity-80"
            >
              <Text className="text-sm font-semibold text-white">
                View on venue site
              </Text>
            </Pressable>
          </View>

          {/* Program */}
          <View className="mb-4">
            <Text className="text-foreground mb-2 text-base font-semibold">
              Program
            </Text>
            <View className="bg-card rounded-xl border p-3">
              {event.program ? (
                <Text className="text-foreground text-sm leading-relaxed">
                  {event.program}
                </Text>
              ) : (
                <Text className="text-muted-foreground text-sm leading-relaxed">
                  Full program information is published by the venue. Open the
                  official listing for repertoire, performers, and any updates.
                </Text>
              )}
              <Pressable
                onPress={() => void Linking.openURL(event.eventUrl)}
                className="mt-3 items-center rounded-lg border py-2 active:opacity-70"
              >
                <Text className="text-foreground text-xs font-medium">
                  Official event page
                </Text>
              </Pressable>
            </View>
          </View>

          {/* About */}
          <View>
            <Text className="text-foreground mb-2 text-base font-semibold">
              About
            </Text>
            <Text className="text-muted-foreground text-sm leading-relaxed">
              This performance is included in Classica from public venue
              calendars. For accessibility, parking, and box office hours, refer
              to {sourceLabel}.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
