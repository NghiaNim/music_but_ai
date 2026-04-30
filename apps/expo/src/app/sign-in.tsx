import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { SocialProvider } from "~/utils/auth";

import {
  authClient,
  DEFAULT_AUTH_CALLBACK,
} from "~/utils/auth";

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
  const isDark = useColorScheme() === "dark";

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#111111" : "#FFFAEF" }}>
      <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 20 }}>
        <View
          style={{
            borderRadius: 18,
            borderWidth: 1,
            borderColor: isDark ? "#2D2D2D" : "#E5E7EB",
            backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF",
            padding: 20,
          }}
        >
          <Text
            style={{
              fontSize: 24,
              fontWeight: "700",
              color: isDark ? "#F9FAFB" : "#111827",
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
              color: "#6B7280",
              textAlign: "center",
            }}
          >
            Sign in to get personalized recommendations, track your concerts,
            and keep your taste profile synced.
          </Text>

          <View style={{ marginTop: 18, gap: 10 }}>
            <ProviderButton
              label="Continue with Discord"
              pending={providerPending === "discord"}
              onPress={() => void handleSignIn("discord")}
              variant="filled"
            />
            <ProviderButton
              label="Continue with Google"
              pending={providerPending === "google"}
              onPress={() => void handleSignIn("google")}
              variant="outline"
            />
          </View>

          <Text
            style={{
              marginTop: 14,
              fontSize: 11,
              color: "#6B7280",
              textAlign: "center",
            }}
          >
            After sign in, you'll continue to your requested page.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function ProviderButton({
  label,
  pending,
  onPress,
  variant,
}: {
  label: string;
  pending: boolean;
  onPress: () => void;
  variant: "filled" | "outline";
}) {
  const isFilled = variant === "filled";
  return (
    <Pressable
      disabled={pending}
      onPress={onPress}
      style={{
        borderRadius: 12,
        borderWidth: 1,
        borderColor: isFilled ? "#9C1738" : "#D4D4D8",
        backgroundColor: isFilled ? "#9C1738" : "#FFFFFF",
        paddingVertical: 12,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {pending ? (
        <ActivityIndicator color={isFilled ? "#FFFFFF" : "#111827"} />
      ) : (
        <Text
          style={{
            color: isFilled ? "#FFFFFF" : "#111827",
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
