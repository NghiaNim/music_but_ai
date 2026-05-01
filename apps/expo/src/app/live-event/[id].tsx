import {
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
  const isDark = useColorScheme() === "dark";

  const bg = isDark ? "#09090B" : "#FAFAF9";
  const card = isDark ? "#1A1A1A" : "#FFFFFF";
  const cardBorder = isDark ? "#27272A" : "#E4E4E7";
  const textPrimary = isDark ? "#F9FAFB" : "#111827";
  const textMuted = "#6B7280";
  const primary = "#9C1738";

  const { data: event, isPending } = useQuery({
    ...trpc.liveEvent.byId.queryOptions({ id }),
    enabled: !!id,
  });

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
          <Text style={{ fontSize: 17, fontWeight: "600", color: textPrimary }}>
            Event not found
          </Text>
          <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
            <Text style={{ color: primary }}>Go back</Text>
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
                backgroundColor: isDark ? "#0C4A6E" : "#E0F2FE",
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color: isDark ? "#7DD3FC" : "#0369A1",
                }}
              >
                {sourceLabel}
              </Text>
            </View>
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
                {GENRE_LABELS[event.genre] ?? event.genre}
              </Text>
            </View>
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
            {venueLine ? (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: 8,
                }}
              >
                <View style={{ marginTop: 2 }}>
                  <Ionicons
                    name="location-outline"
                    size={14}
                    color={textMuted}
                  />
                </View>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 13,
                    color: textMuted,
                    lineHeight: 18,
                  }}
                >
                  {venueLine}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Tickets */}
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
                marginBottom: 4,
              }}
            >
              Tickets & details
            </Text>
            <Text style={{ fontSize: 11, color: textMuted, marginBottom: 12 }}>
              Availability and pricing are handled on the venue's website.
            </Text>
            <Pressable onPress={() => void Linking.openURL(event.buyUrl)}>
              <View
                style={{
                  alignItems: "center",
                  borderRadius: 12,
                  backgroundColor: primary,
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
                  View on venue site
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Ask Ton Ton */}
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/(tabs)/chat",
                params: { mode: "learning", liveEventId: id },
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
              <Ionicons name="sparkles-outline" size={16} color="#D97706" />
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
              {event.program ? (
                <Text
                  style={{ fontSize: 13, color: textPrimary, lineHeight: 20 }}
                >
                  {event.program}
                </Text>
              ) : (
                <Text
                  style={{ fontSize: 13, color: textMuted, lineHeight: 20 }}
                >
                  Full program information is published by the venue. Open the
                  official listing for repertoire, performers, and any updates.
                </Text>
              )}
              <Pressable
                onPress={() => void Linking.openURL(event.eventUrl)}
                style={{ marginTop: 12 }}
              >
                <View
                  style={{
                    alignItems: "center",
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: cardBorder,
                    paddingVertical: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "500",
                      color: textPrimary,
                    }}
                  >
                    Official event page
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>

          {/* About */}
          <View>
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
            <Text style={{ fontSize: 13, color: textMuted, lineHeight: 20 }}>
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
