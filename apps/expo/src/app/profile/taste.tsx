import { useEffect } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { trpc } from "~/utils/api";
import { authClient } from "~/utils/auth";
import { toSignInHref } from "~/utils/auth-redirect";

interface ProfileCard {
  label: string;
  value: string;
}

function isProfileCard(value: unknown): value is ProfileCard {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { label?: unknown; value?: unknown };
  return (
    typeof candidate.label === "string" && typeof candidate.value === "string"
  );
}

export default function TasteProfileScreen() {
  const router = useRouter();
  const isDark = useColorScheme() === "dark";
  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (!session?.user) {
      router.replace(toSignInHref("/profile/taste"));
    }
  }, [router, session?.user]);

  const { data: profile, isPending } = useQuery({
    ...trpc.tasteProfile.get.queryOptions(),
    enabled: !!session?.user,
  });

  const cards = Array.isArray(profile?.profileCards)
    ? profile.profileCards.filter(isProfileCard)
    : [];
  const tags = Array.isArray(profile?.tags) ? profile.tags : [];
  const updatedDate = profile?.lastDerivedAt
    ? new Date(profile.lastDerivedAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: isDark ? "#111111" : "#FFFAEF" }}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 28,
          paddingTop: 12,
        }}
      >
        {isPending ? (
          <View style={{ marginTop: 12, gap: 12 }}>
            <View
              style={{
                height: 180,
                borderRadius: 16,
                backgroundColor: isDark ? "#222" : "#EEE",
              }}
            />
            <View
              style={{
                height: 120,
                borderRadius: 16,
                backgroundColor: isDark ? "#222" : "#EEE",
              }}
            />
          </View>
        ) : !profile?.archetype ? (
          <View
            style={{
              marginTop: 10,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: isDark ? "#2D2D2D" : "#E5E7EB",
              backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF",
              padding: 18,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 38 }}>🎵</Text>
            <Text
              style={{
                marginTop: 8,
                fontSize: 18,
                fontWeight: "700",
                color: isDark ? "#F9FAFB" : "#111827",
              }}
            >
              Discover your sound
            </Text>
            <Text
              style={{
                marginTop: 4,
                fontSize: 13,
                color: "#6B7280",
                textAlign: "center",
              }}
            >
              Take the taste quiz and we will map your musical archetype.
            </Text>
            <Pressable
              onPress={() => router.push("/onboarding/taste")}
              style={{
                marginTop: 12,
                borderRadius: 10,
                backgroundColor: "#9C1738",
                paddingHorizontal: 14,
                paddingVertical: 10,
              }}
            >
              <Text
                style={{ color: "#FFFFFF", fontWeight: "600", fontSize: 13 }}
              >
                Start the quiz
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View
              style={{
                marginTop: 10,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: isDark ? "#2D2D2D" : "#E5E7EB",
                backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF",
                padding: 18,
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 92,
                  height: 92,
                  borderRadius: 46,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#F8E8EE",
                }}
              >
                <Text style={{ fontSize: 44 }}>
                  {profile.badgeEmoji ?? "♪"}
                </Text>
              </View>
              <Text
                style={{
                  marginTop: 10,
                  fontSize: 11,
                  color: "#6B7280",
                  letterSpacing: 1.1,
                }}
              >
                YOU ARE A
              </Text>
              <Text
                style={{
                  marginTop: 4,
                  fontSize: 22,
                  fontWeight: "700",
                  color: isDark ? "#F9FAFB" : "#111827",
                  textAlign: "center",
                }}
              >
                {profile.archetype}
              </Text>
              {tags.length > 0 ? (
                <View
                  style={{
                    marginTop: 10,
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 6,
                    justifyContent: "center",
                  }}
                >
                  {tags.map((tag) => (
                    <View
                      key={tag}
                      style={{
                        borderRadius: 999,
                        backgroundColor: isDark
                          ? "rgba(16,185,129,0.2)"
                          : "#D1FAE5",
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                      }}
                    >
                      <Text
                        style={{
                          color: isDark ? "#6EE7B7" : "#047857",
                          fontSize: 11,
                          fontWeight: "600",
                        }}
                      >
                        {tag}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>

            {cards.length > 0 ? (
              <View
                style={{
                  marginTop: 12,
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                {cards.slice(0, 4).map((card) => (
                  <View
                    key={card.label}
                    style={{
                      width: "48%",
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: isDark ? "#2D2D2D" : "#E5E7EB",
                      backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF",
                      padding: 12,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        letterSpacing: 0.8,
                        color: "#6B7280",
                      }}
                    >
                      {card.label.toUpperCase()}
                    </Text>
                    <Text
                      style={{
                        marginTop: 6,
                        fontSize: 13,
                        fontWeight: "600",
                        color: isDark ? "#F9FAFB" : "#111827",
                      }}
                    >
                      {card.value}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}

            {profile.profileSummary ? (
              <View
                style={{
                  marginTop: 12,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: isDark ? "#2D2D2D" : "#E5E7EB",
                  backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF",
                  padding: 14,
                }}
              >
                <Text
                  style={{ fontSize: 10, letterSpacing: 0.8, color: "#6B7280" }}
                >
                  HOW WE READ YOU
                </Text>
                <Text
                  style={{
                    marginTop: 8,
                    color: isDark ? "#F9FAFB" : "#111827",
                    fontSize: 13,
                    lineHeight: 19,
                  }}
                >
                  {profile.profileSummary}
                </Text>
              </View>
            ) : null}

            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/onboarding/taste",
                  params: { restart: "1" },
                })
              }
              style={{
                marginTop: 16,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: isDark ? "#2D2D2D" : "#E5E7EB",
                backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF",
                padding: 14,
              }}
            >
              <Text
                style={{
                  color: isDark ? "#F9FAFB" : "#111827",
                  fontSize: 14,
                  fontWeight: "600",
                }}
              >
                Re-take the taste quiz
              </Text>
              <Text style={{ marginTop: 2, color: "#6B7280", fontSize: 12 }}>
                Refresh your profile as your preferences evolve.
              </Text>
            </Pressable>

            {updatedDate ? (
              <Text
                style={{
                  marginTop: 10,
                  textAlign: "center",
                  color: "#6B7280",
                  fontSize: 11,
                }}
              >
                Profile last updated {updatedDate}. We will keep refining as you
                explore.
              </Text>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
