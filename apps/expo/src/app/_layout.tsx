import { useColorScheme } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";

import { queryClient } from "~/utils/api";

import "../styles.css";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <QueryClientProvider client={queryClient}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: isDark ? "#1C0A00" : "#FFFBEB" },
          headerTintColor: isDark ? "#FFFFFF" : "#000000",
          headerTitleStyle: { fontWeight: "700" },
          contentStyle: {
            backgroundColor: isDark ? "#09090B" : "#FAFAF9",
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false, title: "Home" }} />
        <Stack.Screen
          name="sign-in"
          options={{
            title: "Sign in",
            headerBackTitle: "Back",
            headerBackButtonDisplayMode: "minimal",
          }}
        />
        <Stack.Screen name="profile/taste" options={{ title: "Your taste" }} />
        <Stack.Screen
          name="onboarding/taste"
          options={{ title: "Taste onboarding" }}
        />
        <Stack.Screen name="tickets" options={{ title: "My tickets" }} />
        <Stack.Screen name="live-event/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="event/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="learn/[slug]" options={{ headerShown: false }} />
        <Stack.Screen name="post/[id]" options={{ title: "Post" }} />
        <Stack.Screen name="waitlist" options={{ title: "Waitlist" }} />
      </Stack>
      <StatusBar />
    </QueryClientProvider>
  );
}
