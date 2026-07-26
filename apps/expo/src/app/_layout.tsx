import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";

import { usePalette } from "~/theme";
import { queryClient } from "~/utils/api";

import "../styles.css";

export default function RootLayout() {
  const { palette, isDark } = usePalette();

  return (
    <QueryClientProvider client={queryClient}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: palette.header },
          headerTintColor: isDark ? "#FFFFFF" : "#000000",
          headerTitleStyle: { fontWeight: "700" },
          contentStyle: {
            backgroundColor: palette.background,
          },
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false, title: "Home" }}
        />
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
          options={{ headerShown: false }}
        />
        <Stack.Screen name="tickets/index" options={{ title: "My tickets" }} />
        <Stack.Screen
          name="tickets/success"
          options={{ title: "Order confirmation", headerBackVisible: false }}
        />
        <Stack.Screen name="journal" options={{ title: "Concert journal" }} />
        <Stack.Screen name="live-event/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="event/[id]" options={{ headerShown: false }} />
        <Stack.Screen
          name="post-event/[id]/edit"
          options={{ title: "Edit event" }}
        />
        <Stack.Screen name="learn/[slug]" options={{ headerShown: false }} />
        <Stack.Screen name="post/[id]" options={{ title: "Post" }} />
        <Stack.Screen name="waitlist" options={{ title: "Waitlist" }} />
      </Stack>
      <StatusBar />
    </QueryClientProvider>
  );
}
