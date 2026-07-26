import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";

import type { Palette } from "~/theme";
import { radius, shadowCard } from "~/theme";

interface ProfileCard {
  label: string;
  value: string;
}

interface ProfileShape {
  archetype: string | null;
  badgeEmoji: string | null;
  tags: string[] | null;
  profileSummary: string | null;
  profileCards: ProfileCard[] | null;
}

interface RevealProps {
  profile: ProfileShape | null;
  isLoading: boolean;
  palette: Palette;
}

const LOADING_MESSAGES = [
  "Mapping your emotional landscape",
  "Cross-referencing 300 years of repertoire",
  "Finding your sonic fingerprint",
  "Crafting your taste profile",
];

export function MinimalReveal({ profile, isLoading, palette }: RevealProps) {
  const router = useRouter();
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!isLoading) return;
    const id = setInterval(() => {
      setMessageIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 1800);
    return () => clearInterval(id);
  }, [isLoading]);

  if (isLoading || !profile?.archetype) {
    return (
      <View style={{ alignItems: "center", gap: 20, paddingVertical: 32 }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: palette.emerald,
          }}
        />
        <Text
          style={{
            fontSize: 13,
            color: palette.mutedForeground,
            textAlign: "center",
          }}
        >
          {LOADING_MESSAGES[messageIndex]}…
        </Text>
      </View>
    );
  }

  const tags = profile.tags ?? [];
  const cards = profile.profileCards ?? [];

  return (
    <View
      style={{
        width: "100%",
        alignItems: "center",
        gap: 16,
        paddingHorizontal: 20,
        paddingVertical: 24,
      }}
    >
      <View
        style={{
          width: "100%",
          borderRadius: radius.card,
          borderWidth: 1,
          borderColor: palette.border,
          backgroundColor: palette.card,
          padding: 24,
          alignItems: "center",
          ...shadowCard,
        }}
      >
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: 48,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#F8E8EE",
          }}
        >
          <Text style={{ fontSize: 44 }}>{profile.badgeEmoji ?? "♪"}</Text>
        </View>
        <Text
          style={{
            marginTop: 16,
            fontSize: 11,
            fontWeight: "600",
            letterSpacing: 0.8,
            textTransform: "uppercase",
            color: palette.mutedForeground,
          }}
        >
          You are a
        </Text>
        <Text
          style={{
            marginTop: 4,
            fontSize: 24,
            fontWeight: "700",
            color: palette.foreground,
            textAlign: "center",
          }}
        >
          {profile.archetype}
        </Text>

        {tags.length > 0 ? (
          <View
            style={{
              marginTop: 16,
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
                  backgroundColor: palette.emeraldSoft,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "500",
                    color: palette.emeraldForeground,
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
            width: "100%",
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          {cards.slice(0, 4).map((card) => (
            <View
              key={card.label}
              style={{
                width: "47%",
                borderRadius: radius.card,
                borderWidth: 1,
                borderColor: palette.border,
                backgroundColor: palette.card,
                padding: 14,
                ...shadowCard,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "600",
                  letterSpacing: 0.8,
                  textTransform: "uppercase",
                  color: palette.mutedForeground,
                }}
              >
                {card.label}
              </Text>
              <Text
                style={{
                  marginTop: 4,
                  fontSize: 13,
                  fontWeight: "600",
                  color: palette.foreground,
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
            width: "100%",
            borderRadius: radius.card,
            borderWidth: 1,
            borderColor: palette.border,
            backgroundColor: palette.card,
            padding: 18,
            ...shadowCard,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              lineHeight: 20,
              color: palette.foreground,
            }}
          >
            {profile.profileSummary}
          </Text>
        </View>
      ) : null}

      <View style={{ width: "100%", gap: 8, paddingTop: 4 }}>
        <Pressable
          onPress={() => router.replace("/(tabs)")}
          style={{
            alignItems: "center",
            borderRadius: radius.lg,
            backgroundColor: palette.primary,
            paddingVertical: 14,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: palette.primaryForeground,
            }}
          >
            See my recommendations
          </Text>
        </Pressable>
        <Pressable
          onPress={() => router.replace("/profile/taste")}
          style={{
            alignItems: "center",
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: palette.border,
            paddingVertical: 14,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: palette.foreground,
            }}
          >
            View my taste profile
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
