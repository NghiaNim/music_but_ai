import {
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { trpc } from "~/utils/api";
import { authClient } from "~/utils/auth";

const GENRE_LABELS: Record<string, string> = {
  orchestral: "Orchestral",
  opera: "Opera",
  chamber: "Chamber",
  solo_recital: "Solo Recital",
  choral: "Choral",
  ballet: "Ballet",
  jazz: "Jazz",
};

const LISTING_LABELS: Record<string, string> = {
  local: "Local / Community",
  concert: "Concert",
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
  const isDark = useColorScheme() === "dark";
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const isSignedIn = !!session?.user;

  const { data: event, isPending } = useQuery({
    ...trpc.event.byId.queryOptions({ id }),
    enabled: !!id,
  });

  const toggleSave = useMutation(
    trpc.userEvent.toggle.mutationOptions({
      onSuccess: (result) => {
        Alert.alert(
          result.action === "added" ? "Event saved!" : "Removed from saved",
        );
        void queryClient.invalidateQueries(trpc.userEvent.pathFilter());
      },
      onError: (err) => {
        Alert.alert(
          "Error",
          err.data?.code === "UNAUTHORIZED"
            ? "Sign in to save events"
            : "Something went wrong",
        );
      },
    }),
  );

  const toggleAttended = useMutation(
    trpc.userEvent.toggle.mutationOptions({
      onSuccess: (result) => {
        Alert.alert(
          result.action === "added" ? "Marked as attended!" : "Removed",
        );
        void queryClient.invalidateQueries(trpc.userEvent.pathFilter());
      },
      onError: (err) => {
        Alert.alert(
          "Error",
          err.data?.code === "UNAUTHORIZED"
            ? "Sign in to track events"
            : "Something went wrong",
        );
      },
    }),
  );

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

  const isCancelled = event.publicationStatus === "cancelled";
  const date = new Date(event.date);
  const when = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const diffColors = DIFFICULTY_COLORS[event.difficulty] ?? {
    bg: "#D1FAE5",
    text: "#065F46",
  };
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
        <View className="mx-4 mb-4 aspect-video overflow-hidden rounded-2xl">
          {event.imageUrl ? (
            <Image
              source={{ uri: event.imageUrl }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : (
            <View
              className="flex-1 items-center justify-center"
              style={{
                backgroundColor: isDark
                  ? "rgba(120,53,15,0.3)"
                  : "#FEF3C7",
              }}
            >
              <Ionicons name="musical-notes" size={48} color={isDark ? "#FB923C" : "#EA580C"} />
            </View>
          )}
        </View>

        <View className="px-4">
          {/* Cancelled banner */}
          {isCancelled && (
            <View className="mb-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 dark:border-red-900/40 dark:bg-red-950/30">
              <Text className="text-sm font-medium text-red-700 dark:text-red-300">
                This event has been cancelled by the host.
              </Text>
            </View>
          )}

          {/* Tags */}
          <View className="mb-3 flex-row flex-wrap gap-2">
            <View className="bg-muted rounded-full px-2.5 py-1">
              <Text className="text-foreground text-xs font-medium">
                {LISTING_LABELS[event.listingCategory] ??
                  event.listingCategory}
              </Text>
            </View>
            <View
              className="rounded-full px-2.5 py-1"
              style={{ backgroundColor: isDark ? "#1e3a5f" : "#dbeafe" }}
            >
              <Text
                className="text-xs font-medium"
                style={{ color: isDark ? "#93c5fd" : "#1d4ed8" }}
              >
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
            {event.isFree && (
              <View className="rounded-full bg-emerald-100 px-2.5 py-1 dark:bg-emerald-900/40">
                <Text className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  Free
                </Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Text className="text-foreground mb-1 text-xl font-bold leading-snug">
            {event.title}
          </Text>

          {/* Date & venue */}
          <View className="mb-4 mt-3 gap-2">
            <View className="flex-row items-start gap-2">
              <View className="mt-0.5">
                <Ionicons name="calendar-outline" size={14} color="#6B7280" />
              </View>
              <Text className="text-muted-foreground flex-1 text-sm">
                {when}
              </Text>
            </View>
            <View className="flex-row items-start gap-2">
              <View className="mt-0.5">
                <Ionicons name="location-outline" size={14} color="#6B7280" />
              </View>
              <Text className="text-muted-foreground flex-1 text-sm">
                {event.venue}
                {event.venueAddress ? `\n${event.venueAddress}` : ""}
              </Text>
            </View>
          </View>

          <View className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/30 dark:bg-amber-950/20">
            <Text className="text-sm font-semibold text-amber-700 dark:text-amber-300">
              Ask Ton Ton about this event
            </Text>
            <Text className="text-muted-foreground mt-1 text-xs">
              Get a quick guide on what to listen for and why this program
              stands out.
            </Text>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/chat",
                  params: { mode: "learning", eventId: event.id },
                })
              }
              className="mt-3 items-center rounded-xl bg-[#9C1738] py-3 active:opacity-80"
            >
              <Text className="text-sm font-semibold text-white">
                Ask Ton Ton
              </Text>
            </Pressable>
          </View>

          {/* Ticket / price card */}
          {event.isFree ? (
            <View className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/30 dark:bg-emerald-950/20">
              <Text className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                Free admission
              </Text>
              <Text className="text-muted-foreground mt-0.5 text-xs">
                No ticket required — just show up.
                {ticketUrl ? " RSVP at the link below if requested." : ""}
              </Text>
              {ticketUrl ? (
                <Pressable
                  onPress={() => void Linking.openURL(ticketUrl)}
                  className="mt-3 items-center rounded-xl border py-3 active:opacity-80"
                >
                  <Text className="text-foreground text-sm font-semibold">
                    RSVP / More info
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : (
            <View className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/30 dark:bg-emerald-950/20">
              <Text className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                ${(event.discountedPriceCents / 100).toFixed(2)}
              </Text>
              <Text className="text-muted-foreground mb-3 text-xs">
                {event.ticketsAvailable} tickets remaining
              </Text>
              {ticketUrl ? (
                <Pressable
                  onPress={() => void Linking.openURL(ticketUrl)}
                  className="items-center rounded-xl bg-emerald-600 py-3 active:opacity-80"
                >
                  <Text className="text-sm font-semibold text-white">
                    Get Tickets
                  </Text>
                </Pressable>
              ) : null}
            </View>
          )}

          {/* Save / Attended buttons */}
          {!isCancelled && (
            <View className="mb-4 flex-row gap-2">
              <Pressable
                onPress={() => {
                  if (!isSignedIn) {
                    Alert.alert("Sign in required", "Sign in to save events.");
                    return;
                  }
                  toggleSave.mutate({ eventId: id, status: "saved" });
                }}
                disabled={toggleSave.isPending}
                className="flex-1 active:opacity-70"
              >
                <View className="flex-row items-center justify-center gap-1.5 rounded-xl border py-3">
                  <Ionicons
                    name="bookmark-outline"
                    size={15}
                    color={isDark ? "#9CA3AF" : "#6B7280"}
                  />
                  <Text className="text-foreground text-sm font-medium">
                    Save
                  </Text>
                </View>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (!isSignedIn) {
                    Alert.alert(
                      "Sign in required",
                      "Sign in to track events.",
                    );
                    return;
                  }
                  toggleAttended.mutate({ eventId: id, status: "attended" });
                }}
                disabled={toggleAttended.isPending}
                className="flex-1 active:opacity-70"
              >
                <View className="flex-row items-center justify-center gap-1.5 rounded-xl border py-3">
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={15}
                    color={isDark ? "#9CA3AF" : "#6B7280"}
                  />
                  <Text className="text-foreground text-sm font-medium">
                    I Went
                  </Text>
                </View>
              </Pressable>
            </View>
          )}

          {/* Beginner notes */}
          {event.beginnerNotes ? (
            <View className="border-primary/20 bg-primary/5 mb-4 rounded-2xl border p-4">
              <View className="mb-2 flex-row items-center gap-2">
                <Ionicons name="bulb-outline" size={18} color="#9C1738" />
                <Text className="text-foreground font-semibold">
                  For Beginners
                </Text>
              </View>
              <Text className="text-muted-foreground text-sm leading-relaxed">
                {event.beginnerNotes}
              </Text>
            </View>
          ) : null}

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

          {/* About */}
          {event.description ? (
            <View className="mb-4">
              <Text className="text-foreground mb-2 text-base font-semibold">
                About
              </Text>
              <Text className="text-muted-foreground text-sm leading-relaxed">
                {event.description}
              </Text>
            </View>
          ) : null}

          {/* Venue detail */}
          {event.venueAddress ? (
            <View className="mb-4">
              <Text className="text-foreground mb-2 text-base font-semibold">
                Venue
              </Text>
              <View className="bg-card rounded-xl border p-3">
                <Text className="text-foreground text-sm font-medium">
                  {event.venue}
                </Text>
                <Text className="text-muted-foreground mt-0.5 text-xs">
                  {event.venueAddress}
                </Text>
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
