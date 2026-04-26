import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { useMutation } from "@tanstack/react-query";

import { trpc } from "~/utils/api";

export default function WaitlistScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<"idle" | "joined" | "already_joined">(
    "idle",
  );

  const joinWaitlist = useMutation(
    trpc.waitlist.join.mutationOptions({
      onSuccess(data) {
        setResult(data.status);
        if (data.status === "joined") {
          setName("");
          setEmail("");
        }
      },
    }),
  );

  const canSubmit =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    !joinWaitlist.isPending;

  return (
    <SafeAreaView className="bg-background flex-1">
      <Stack.Screen options={{ title: "Join Waitlist" }} />
      <View className="flex-1 px-5 pt-6">
        <Text className="text-foreground text-3xl font-bold">
          Join Waitlist
        </Text>
        <Text className="text-muted-foreground mt-2 text-sm">
          Join now and we will notify you when new features launch.
        </Text>

        <View className="mt-6 gap-3">
          <TextInput
            className="border-input bg-card text-foreground rounded-xl border px-4 py-3 text-base"
            value={name}
            onChangeText={setName}
            placeholder="Name"
            autoCapitalize="words"
          />
          <TextInput
            className="border-input bg-card text-foreground rounded-xl border px-4 py-3 text-base"
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Pressable
            className={`items-center rounded-xl px-4 py-3 ${
              canSubmit ? "bg-[#9C1738]" : "bg-zinc-400"
            }`}
            disabled={!canSubmit}
            onPress={() => {
              joinWaitlist.mutate({
                name: name.trim(),
                email: email.trim().toLowerCase(),
                source: "mobile",
              });
            }}
          >
            <Text className="text-base font-semibold text-white">
              {joinWaitlist.isPending ? "Joining..." : "Join Waitlist"}
            </Text>
          </Pressable>
        </View>

        {result === "joined" && (
          <Text className="mt-4 text-sm text-emerald-600">
            You are on the list. Thanks for joining!
          </Text>
        )}
        {result === "already_joined" && (
          <Text className="mt-4 text-sm text-zinc-600">
            This email is already on the waitlist.
          </Text>
        )}
        {joinWaitlist.error && (
          <Text className="mt-4 text-sm text-red-600">
            Could not join right now. Please try again.
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}
