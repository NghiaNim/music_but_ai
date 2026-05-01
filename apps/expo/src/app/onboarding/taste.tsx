import { useEffect } from "react";
import { Pressable, Text, useColorScheme, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";

import { trpc } from "~/utils/api";
import { authClient } from "~/utils/auth";
import { toSignInHref } from "~/utils/auth-redirect";

export default function TasteOnboardingBridgeScreen() {
  const isDark = useColorScheme() === "dark";
  const router = useRouter();
  const params = useLocalSearchParams<{ restart?: string }>();
  const shouldRestart = params.restart === "1";
  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (!session?.user) {
      router.replace(toSignInHref("/onboarding/taste"));
    }
  }, [router, session?.user]);

  const restartSession = useMutation(
    trpc.onboarding.restartSession.mutationOptions(),
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: isDark ? "#111111" : "#FFFAEF" }}
    >
      <View
        style={{ flex: 1, justifyContent: "center", paddingHorizontal: 20 }}
      >
        <View
          style={{
            borderRadius: 18,
            borderWidth: 1,
            borderColor: isDark ? "#2D2D2D" : "#E5E7EB",
            backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF",
            padding: 20,
          }}
        >
          <Text style={{ fontSize: 34, textAlign: "center" }}>✨</Text>
          <Text
            style={{
              marginTop: 10,
              fontSize: 20,
              fontWeight: "700",
              textAlign: "center",
              color: isDark ? "#F9FAFB" : "#111827",
            }}
          >
            Taste onboarding on mobile
          </Text>
          <Text
            style={{
              marginTop: 8,
              textAlign: "center",
              color: "#6B7280",
              fontSize: 13,
              lineHeight: 20,
            }}
          >
            We are shipping full Expo onboarding parity next. For now, you can
            view your current taste profile or continue exploring events.
          </Text>

          <View style={{ marginTop: 16, gap: 10 }}>
            <Pressable
              onPress={() => router.replace("/profile/taste")}
              style={{
                borderRadius: 10,
                backgroundColor: "#9C1738",
                alignItems: "center",
                paddingVertical: 11,
              }}
            >
              <Text
                style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "600" }}
              >
                View my taste profile
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.replace("/(tabs)/events")}
              style={{
                borderRadius: 10,
                borderWidth: 1,
                borderColor: isDark ? "#3F3F46" : "#D4D4D8",
                alignItems: "center",
                paddingVertical: 11,
              }}
            >
              <Text
                style={{
                  color: isDark ? "#F9FAFB" : "#111827",
                  fontSize: 13,
                  fontWeight: "600",
                }}
              >
                Explore events
              </Text>
            </Pressable>
          </View>

          {shouldRestart ? (
            <Pressable
              disabled={restartSession.isPending}
              onPress={() => restartSession.mutate()}
              style={{ marginTop: 14, alignSelf: "center" }}
            >
              <Text style={{ color: "#6B7280", fontSize: 12 }}>
                {restartSession.isPending
                  ? "Restarting..."
                  : "Reset my onboarding session"}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}
