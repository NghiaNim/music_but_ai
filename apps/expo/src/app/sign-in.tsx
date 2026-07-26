import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import type { Palette } from "~/theme";
import type { SocialProvider } from "~/utils/auth";
import { usePalette } from "~/theme";
import { authClient, DEFAULT_AUTH_CALLBACK } from "~/utils/auth";

function normalizeCallback(raw: string | string[] | undefined) {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return DEFAULT_AUTH_CALLBACK;
  return value.startsWith("/") ? value : DEFAULT_AUTH_CALLBACK;
}

export default function SignInScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ callbackUrl?: string | string[] }>();
  const callbackUrl = useMemo(
    () => normalizeCallback(params.callbackUrl),
    [params.callbackUrl],
  );
  const { data: session } = authClient.useSession();
  const [providerPending, setProviderPending] = useState<SocialProvider | null>(
    null,
  );
  const { palette, isDark } = usePalette();

  useEffect(() => {
    if (session?.user) {
      router.replace(callbackUrl as never);
    }
  }, [callbackUrl, router, session?.user]);

  const handleSignIn = async (provider: SocialProvider) => {
    if (providerPending) return;
    setProviderPending(provider);
    try {
      await authClient.signIn.social({
        provider,
        callbackURL: callbackUrl,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not start sign in.";
      Alert.alert("Sign in failed", message);
    } finally {
      setProviderPending(null);
    }
  };

  const violetBorder = isDark ? "#5B21B6" : "#DDD6FE";
  const violetBg = isDark ? "rgba(76,29,149,0.3)" : "#F5F3FF";
  const violetIconBg = isDark ? "rgba(76,29,149,0.3)" : "#EDE9FE";
  const violetIconColor = isDark ? "#A78BFA" : "#7C3AED";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: 20,
          paddingVertical: 32,
        }}
      >
        <View style={{ alignItems: "center", gap: 16, marginBottom: 32 }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: `${palette.primary}1A`,
            }}
          >
            <Ionicons name="musical-notes" size={40} color={palette.primary} />
          </View>
          <View>
            <Text
              style={{
                fontSize: 24,
                fontWeight: "700",
                color: palette.foreground,
                textAlign: "center",
              }}
            >
              Welcome to Classica
            </Text>
            <Text
              style={{
                marginTop: 8,
                fontSize: 13,
                lineHeight: 20,
                color: palette.mutedForeground,
                textAlign: "center",
              }}
            >
              Sign in to take the Music Quiz, get personalized recommendations,
              and track your concert journey.
            </Text>
          </View>
        </View>

        <View style={{ gap: 10 }}>
          <ProviderButton
            label="Continue with Discord"
            pending={providerPending === "discord"}
            onPress={() => void handleSignIn("discord")}
            variant="filled"
            palette={palette}
          />
          <ProviderButton
            label="Continue with Google"
            pending={providerPending === "google"}
            onPress={() => void handleSignIn("google")}
            variant="outline"
            palette={palette}
          />
        </View>

        <View
          style={{
            marginTop: 32,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: violetBorder,
            backgroundColor: violetBg,
            padding: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: violetIconBg,
                flexShrink: 0,
              }}
            >
              <Ionicons name="pulse" size={20} color={violetIconColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: palette.foreground,
                }}
              >
                Then take the Music Quiz
              </Text>
              <Text
                style={{
                  marginTop: 2,
                  fontSize: 12,
                  color: palette.mutedForeground,
                }}
              >
                1 min — tell us your taste, hear some music
              </Text>
            </View>
          </View>
        </View>

        <View style={{ marginTop: 16, flexDirection: "row", gap: 12 }}>
          <FeatureTile
            title="Discover"
            subtitle="AI-picked events"
            bg={isDark ? "rgba(6,78,59,0.3)" : "#ECFDF5"}
            borderColor={palette.border}
            palette={palette}
          />
          <FeatureTile
            title="Learn"
            subtitle="Classical & jazz 101"
            bg={isDark ? "rgba(120,53,15,0.3)" : "#FFFBEB"}
            borderColor={palette.border}
            palette={palette}
          />
          <FeatureTile
            title="Journal"
            subtitle="Track concerts"
            bg={isDark ? "rgba(12,74,110,0.3)" : "#F0F9FF"}
            borderColor={palette.border}
            palette={palette}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureTile({
  title,
  subtitle,
  bg,
  borderColor,
  palette,
}: {
  title: string;
  subtitle: string;
  bg: string;
  borderColor: string;
  palette: Palette;
}) {
  return (
    <View
      style={{
        flex: 1,
        borderRadius: 16,
        borderWidth: 1,
        borderColor,
        backgroundColor: bg,
        padding: 12,
        alignItems: "center",
      }}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: "600",
          color: palette.foreground,
          textAlign: "center",
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          marginTop: 2,
          fontSize: 10,
          color: palette.mutedForeground,
          textAlign: "center",
        }}
      >
        {subtitle}
      </Text>
    </View>
  );
}

function ProviderButton({
  label,
  pending,
  onPress,
  variant,
  palette,
}: {
  label: string;
  pending: boolean;
  onPress: () => void;
  variant: "filled" | "outline";
  palette: Palette;
}) {
  const isFilled = variant === "filled";
  return (
    <Pressable
      disabled={pending}
      onPress={onPress}
      style={{
        borderRadius: 12,
        borderWidth: 1,
        borderColor: isFilled ? palette.primary : palette.border,
        backgroundColor: isFilled ? palette.primary : palette.input,
        paddingVertical: 14,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {pending ? (
        <ActivityIndicator
          color={isFilled ? palette.primaryForeground : palette.foreground}
        />
      ) : (
        <Text
          style={{
            color: isFilled ? palette.primaryForeground : palette.foreground,
            fontSize: 14,
            fontWeight: "600",
          }}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}
