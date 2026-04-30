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

  const bg = isDark ? "#09090B" : "#FAFAF9";
  const card = isDark ? "#1A1A1A" : "#FFFFFF";
  const cardBorder = isDark ? "#27272A" : "#E4E4E7";
  const textPrimary = isDark ? "#F9FAFB" : "#111827";
  const textMuted = "#6B7280";
  const primary = "#9C1738";

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
      <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ fontSize: 13, color: textMuted }}>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 32,
          }}
        >
          <Text
            style={{ fontSize: 17, fontWeight: "600", color: textPrimary }}
          >
            Event not found
          </Text>
          <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
            <Text style={{ color: primary }}>Go back</Text>
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

  const diffColors =
    DIFFICULTY_COLORS[event.difficulty] ??
    ({ bg: "#D1FAE5", text: "#065F46" } as const);
  const ticketUrl = event.ticketUrl;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <Pressable
          onPress={() => router.back()}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            marginHorizontal: 16,
            marginTop: 12,
            marginBottom: 8,
          }}
        >
          <Ionicons name="chevron-back" size={16} color={primary} />
          <Text style={{ fontSize: 13, color: primary }}>Events</Text>
        </Pressable>

        {/* Hero image */}
        <View
          style={{
            marginHorizontal: 16,
            marginBottom: 16,
            aspectRatio: 16 / 9,
            borderRadius: 16,
            overflow: "hidden",
            backgroundColor: isDark ? "#1C1107" : "#FEF3C7",
          }}
        >
          {event.imageUrl ? (
            <Image
              source={{ uri: event.imageUrl }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name="musical-notes"
                size={48}
                color={isDark ? "#FB923C" : "#EA580C"}
              />
            </View>
          )}
        </View>

        <View style={{ paddingHorizontal: 16 }}>
          {/* Cancelled banner */}
          {isCancelled && (
            <View
              style={{
                marginBottom: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: isDark ? "#7F1D1D" : "#FECACA",
                backgroundColor: isDark ? "#1C0A0A" : "#FEF2F2",
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "500",
                  color: isDark ? "#FCA5A5" : "#B91C1C",
                }}
              >
                This event has been cancelled by the host.
              </Text>
            </View>
          )}

          {/* Tags */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 6,
              marginBottom: 10,
            }}
          >
            <View
              style={{
                borderRadius: 999,
                paddingHorizontal: 10,
                paddingVertical: 4,
                backgroundColor: isDark ? "#27272A" : "#F4F4F5",
              }}
            >
              <Text
                style={{ fontSize: 11, fontWeight: "500", color: textMuted }}
              >
                {LISTING_LABELS[event.listingCategory] ??
                  event.listingCategory}
              </Text>
            </View>
            <View
              style={{
                borderRadius: 999,
                paddingHorizontal: 10,
                paddingVertical: 4,
                backgroundColor: isDark ? "#1e3a5f" : "#DBEAFE",
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "500",
                  color: isDark ? "#93C5FD" : "#1D4ED8",
                }}
              >
                {GENRE_LABELS[event.genre] ?? event.genre}
              </Text>
            </View>
            <View
              style={{
                borderRadius: 999,
                paddingHorizontal: 10,
                paddingVertical: 4,
                backgroundColor: diffColors.bg,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color: diffColors.text,
                }}
              >
                {DIFFICULTY_LABELS[event.difficulty] ?? event.difficulty}
              </Text>
            </View>
            {event.isFree && (
              <View
                style={{
                  borderRadius: 999,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  backgroundColor: isDark ? "#064E3B" : "#D1FAE5",
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "600",
                    color: isDark ? "#6EE7B7" : "#047857",
                  }}
                >
                  Free
                </Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: textPrimary,
              lineHeight: 26,
              marginBottom: 12,
            }}
          >
            {event.title}
          </Text>

          {/* Date & venue */}
          <View style={{ gap: 8, marginBottom: 16 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 8,
              }}
            >
              <View style={{ marginTop: 2 }}>
                <Ionicons name="calendar-outline" size={14} color={textMuted} />
              </View>
              <Text
                style={{
                  flex: 1,
                  fontSize: 13,
                  color: textMuted,
                  lineHeight: 18,
                }}
              >
                {when}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 8,
              }}
            >
              <View style={{ marginTop: 2 }}>
                <Ionicons name="location-outline" size={14} color={textMuted} />
              </View>
              <Text
                style={{
                  flex: 1,
                  fontSize: 13,
                  color: textMuted,
                  lineHeight: 18,
                }}
              >
                {event.venue}
                {event.venueAddress ? `\n${event.venueAddress}` : ""}
              </Text>
            </View>
          </View>

          {/* Ticket / price card */}
          {event.isFree ? (
            <View
              style={{
                marginBottom: 16,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: isDark ? "#064E3B" : "#A7F3D0",
                backgroundColor: isDark ? "#022C22" : "#ECFDF5",
                padding: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: isDark ? "#6EE7B7" : "#047857",
                }}
              >
                Free admission
              </Text>
              <Text
                style={{ fontSize: 11, color: textMuted, marginTop: 2 }}
              >
                No ticket required — just show up.
                {ticketUrl ? " RSVP at the link below if requested." : ""}
              </Text>
              {ticketUrl ? (
                <Pressable
                  onPress={() => void Linking.openURL(ticketUrl)}
                  style={{ marginTop: 12 }}
                >
                  <View
                    style={{
                      alignItems: "center",
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: cardBorder,
                      paddingVertical: 12,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: textPrimary,
                      }}
                    >
                      RSVP / More info
                    </Text>
                  </View>
                </Pressable>
              ) : null}
            </View>
          ) : (
            <View
              style={{
                marginBottom: 16,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: isDark ? "#064E3B" : "#A7F3D0",
                backgroundColor: isDark ? "#022C22" : "#ECFDF5",
                padding: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "700",
                  color: isDark ? "#34D399" : "#047857",
                }}
              >
                ${(event.discountedPriceCents / 100).toFixed(2)}
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: textMuted,
                  marginBottom: 12,
                }}
              >
                {event.ticketsAvailable} tickets remaining
              </Text>
              {ticketUrl ? (
                <Pressable onPress={() => void Linking.openURL(ticketUrl)}>
                  <View
                    style={{
                      alignItems: "center",
                      borderRadius: 12,
                      backgroundColor: "#059669",
                      paddingVertical: 12,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: "#FFFFFF",
                      }}
                    >
                      Get Tickets
                    </Text>
                  </View>
                </Pressable>
              ) : null}
            </View>
          )}

          {/* Save / I Went */}
          {!isCancelled && (
            <View
              style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}
            >
              <Pressable
                onPress={() => {
                  if (!isSignedIn) {
                    Alert.alert("Sign in required", "Sign in to save events.");
                    return;
                  }
                  if (id) toggleSave.mutate({ eventId: id, status: "saved" });
                }}
                disabled={toggleSave.isPending}
                style={{ flex: 1 }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: cardBorder,
                    paddingVertical: 12,
                    backgroundColor: card,
                  }}
                >
                  <Ionicons
                    name="bookmark-outline"
                    size={15}
                    color={textMuted}
                  />
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "500",
                      color: textPrimary,
                    }}
                  >
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
                  if (id)
                    toggleAttended.mutate({
                      eventId: id,
                      status: "attended",
                    });
                }}
                disabled={toggleAttended.isPending}
                style={{ flex: 1 }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: cardBorder,
                    paddingVertical: 12,
                    backgroundColor: card,
                  }}
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={15}
                    color={textMuted}
                  />
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "500",
                      color: textPrimary,
                    }}
                  >
                    I Went
                  </Text>
                </View>
              </Pressable>
            </View>
          )}

          {/* Ask Ton Ton */}
          {!isCancelled && (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/chat",
                  params: { mode: "learning", eventId: id },
                })
              }
              style={{ marginBottom: 16 }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  borderRadius: 12,
                  paddingVertical: 13,
                  backgroundColor: isDark ? "#1C0A00" : "#FFFBEB",
                  borderWidth: 1,
                  borderColor: isDark ? "#78350F" : "#FDE68A",
                }}
              >
                <Ionicons
                  name="sparkles-outline"
                  size={16}
                  color="#D97706"
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: isDark ? "#FCD34D" : "#92400E",
                  }}
                >
                  Ask Ton Ton About This Event
                </Text>
              </View>
            </Pressable>
          )}

          {/* Beginner notes */}
          {event.beginnerNotes ? (
            <View
              style={{
                marginBottom: 16,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: isDark ? "#3B0764" : "#E9D5FF",
                backgroundColor: isDark ? "#1A0636" : "#FAF5FF",
                padding: 16,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <Ionicons name="bulb-outline" size={18} color={primary} />
                <Text
                  style={{ fontWeight: "600", color: textPrimary }}
                >
                  For Beginners
                </Text>
              </View>
              <Text
                style={{ fontSize: 13, color: textMuted, lineHeight: 20 }}
              >
                {event.beginnerNotes}
              </Text>
            </View>
          ) : null}

          {/* Program */}
          <View style={{ marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 15,
                fontWeight: "600",
                color: textPrimary,
                marginBottom: 8,
              }}
            >
              Program
            </Text>
            <View
              style={{
                borderRadius: 12,
                borderWidth: 1,
                borderColor: cardBorder,
                backgroundColor: card,
                padding: 12,
              }}
            >
              <Text
                style={{ fontSize: 13, color: textPrimary, lineHeight: 20 }}
              >
                {event.program}
              </Text>
            </View>
          </View>

          {/* About */}
          {event.description ? (
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "600",
                  color: textPrimary,
                  marginBottom: 8,
                }}
              >
                About
              </Text>
              <Text
                style={{ fontSize: 13, color: textMuted, lineHeight: 20 }}
              >
                {event.description}
              </Text>
            </View>
          ) : null}

          {/* Venue detail */}
          {event.venueAddress ? (
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "600",
                  color: textPrimary,
                  marginBottom: 8,
                }}
              >
                Venue
              </Text>
              <View
                style={{
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: cardBorder,
                  backgroundColor: card,
                  padding: 12,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "500",
                    color: textPrimary,
                  }}
                >
                  {event.venue}
                </Text>
                <Text
                  style={{ fontSize: 11, color: textMuted, marginTop: 2 }}
                >
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
