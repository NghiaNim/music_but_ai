import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Ellipse, Path, Rect } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";

import { trpc } from "~/utils/api";

function BackgroundOrbs() {
  return (
    <View className="absolute inset-0" pointerEvents="none">
      <View className="absolute top-12 left-[6%] h-40 w-40 rounded-full bg-amber-200/30" />
      <View className="absolute top-32 right-[10%] h-44 w-44 rounded-full bg-rose-200/25" />
      <View className="absolute bottom-20 left-[20%] h-48 w-48 rounded-full bg-violet-200/20" />
      <View className="absolute right-[8%] bottom-10 h-32 w-32 rounded-full bg-amber-300/20" />
    </View>
  );
}

function FloatingNotes() {
  return (
    <View className="absolute inset-0" pointerEvents="none">
      <Svg
        style={{ position: "absolute", top: 96, left: "14%" }}
        width={28}
        height={28}
        viewBox="0 0 24 24"
        fill="#F6A6B4"
        opacity={0.75}
      >
        <Rect x={11} y={3} width={2} height={13} />
        <Path d="M13 3 Q19 5 19 10 Q19 7 13 7 Z" />
        <Ellipse cx={9} cy={17} rx={4} ry={3} />
      </Svg>
      <Svg
        style={{ position: "absolute", top: 80, right: "20%" }}
        width={32}
        height={32}
        viewBox="0 0 24 24"
        fill="#F5BF47"
        opacity={0.72}
      >
        <Rect x={5.3} y={6} width={1.4} height={13} />
        <Rect x={17.3} y={4} width={1.4} height={13} />
        <Path d="M5 4.5 L19 2.5 L19 5 L5 7 Z" />
        <Ellipse cx={4} cy={19} rx={3.2} ry={2.3} />
        <Ellipse cx={16} cy={17} rx={3.2} ry={2.3} />
      </Svg>
      <Svg
        style={{ position: "absolute", top: 192, left: "58%" }}
        width={22}
        height={22}
        viewBox="0 0 24 24"
        fill="#F7B17A"
        opacity={0.68}
      >
        <Rect x={11} y={3} width={2} height={13} />
        <Path d="M13 3 Q19 5 19 10 Q19 7 13 7 Z" />
        <Ellipse cx={9} cy={17} rx={4} ry={3} />
      </Svg>
      <Svg
        style={{ position: "absolute", top: 64, left: "10%" }}
        width={22}
        height={22}
        viewBox="0 0 24 24"
        fill="#FBBF24"
        opacity={0.4}
      >
        <Path d="M12 2.5 13.9 8l5.6 1.9-5.6 1.9L12 17.5l-1.9-5.7L4.5 9.9 10.1 8z" />
      </Svg>
      <Svg
        style={{ position: "absolute", top: 160, right: "14%" }}
        width={18}
        height={18}
        viewBox="0 0 24 24"
        fill="#FB7185"
        opacity={0.35}
      >
        <Path d="M12 2.5 13.9 8l5.6 1.9-5.6 1.9L12 17.5l-1.9-5.7L4.5 9.9 10.1 8z" />
      </Svg>
    </View>
  );
}

const STATS = [
  { value: "Free", label: "Always free to join" },
  { value: "2 min", label: "Taste profile setup" },
  { value: "Ton Ton", label: "Your personal guide" },
] as const;

export default function WaitlistScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [orgName, setOrgName] = useState("");
  const [result, setResult] = useState<"idle" | "joined" | "already_joined">(
    "idle",
  );
  const [confirmedEmail, setConfirmedEmail] = useState("");

  const joinWaitlist = useMutation(
    trpc.waitlist.join.mutationOptions({
      onSuccess(data, variables) {
        setResult(data.status);
        if (data.status === "joined") {
          setConfirmedEmail(variables.email);
          setFirstName("");
          setLastName("");
          setEmail("");
          setCity("");
          setOrgName("");
        }
      },
    }),
  );

  const canSubmit =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    email.trim().length > 0 &&
    city.trim().length > 0 &&
    !joinWaitlist.isPending;

  return (
    <View className="flex-1">
      <Stack.Screen options={{ title: "Waitlist" }} />
      <LinearGradient
        colors={["#FFFBEB", "#FFF1F2", "#F5F3FF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", inset: 0 }}
      />
      <BackgroundOrbs />
      <FloatingNotes />
      <SafeAreaView className="flex-1">
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          className="px-5 pt-4 pb-10"
        >
          <View className="flex-1 items-center justify-center">
            <View className="mb-8 items-center">
              <Text className="text-center text-3xl font-bold tracking-tight text-gray-900">
                Join the waitlist
              </Text>
              <Text className="mt-3 max-w-xs text-center text-base leading-6 text-gray-500">
                Be first to discover concerts matched to your taste, guided by
                Ton Ton.
              </Text>
              <Text className="mt-4 max-w-xs text-center text-sm text-amber-700/80 italic">
                "Big feelings? I know a symphony for that."
              </Text>
            </View>

            <View
              className="w-full rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-sm"
              style={{
                shadowColor: "#D68F5C",
                shadowOpacity: 0.12,
                shadowRadius: 30,
                shadowOffset: { width: 0, height: 20 },
              }}
            >
              {result === "joined" ? (
                <View className="items-center gap-6 py-4">
                  <View className="size-16 items-center justify-center rounded-full bg-amber-100">
                    <Text className="text-3xl">🎶</Text>
                  </View>
                  <View>
                    <Text className="text-center text-lg font-semibold text-gray-900">
                      You're on the list!
                    </Text>
                    <Text className="mt-1 text-center text-sm text-gray-500">
                      We'll reach out to {confirmedEmail} when Classica is ready
                      for you.
                    </Text>
                  </View>
                  <Pressable
                    className="w-full items-center rounded-xl border border-gray-300 px-4 py-3"
                    onPress={() => router.push("/(tabs)")}
                  >
                    <Text className="text-base font-semibold text-gray-900">
                      Try the Demo
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <View className="gap-4">
                  <View className="flex-row gap-3">
                    <View className="flex-1 gap-1.5">
                      <Text className="text-sm font-medium text-gray-700">
                        First name
                      </Text>
                      <TextInput
                        className="rounded-lg border border-gray-200 bg-white/70 px-3 py-2.5 text-base text-gray-900"
                        value={firstName}
                        onChangeText={setFirstName}
                        placeholder="Anna"
                        placeholderTextColor="#9CA3AF"
                        autoCapitalize="words"
                        autoComplete="given-name"
                      />
                    </View>
                    <View className="flex-1 gap-1.5">
                      <Text className="text-sm font-medium text-gray-700">
                        Last name
                      </Text>
                      <TextInput
                        className="rounded-lg border border-gray-200 bg-white/70 px-3 py-2.5 text-base text-gray-900"
                        value={lastName}
                        onChangeText={setLastName}
                        placeholder="Zhang"
                        placeholderTextColor="#9CA3AF"
                        autoCapitalize="words"
                        autoComplete="family-name"
                      />
                    </View>
                  </View>

                  <View className="gap-1.5">
                    <Text className="text-sm font-medium text-gray-700">
                      Email
                    </Text>
                    <TextInput
                      className="rounded-lg border border-gray-200 bg-white/70 px-3 py-2.5 text-base text-gray-900"
                      value={email}
                      onChangeText={setEmail}
                      placeholder="you@example.com"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="email"
                    />
                  </View>

                  <View className="gap-1.5">
                    <Text className="text-sm font-medium text-gray-700">
                      City
                    </Text>
                    <TextInput
                      className="rounded-lg border border-gray-200 bg-white/70 px-3 py-2.5 text-base text-gray-900"
                      value={city}
                      onChangeText={setCity}
                      placeholder="New York"
                      placeholderTextColor="#9CA3AF"
                      autoCapitalize="words"
                      autoComplete="postal-address-locality"
                    />
                  </View>

                  <View className="gap-1.5">
                    <Text className="text-sm font-medium text-gray-700">
                      Organization name{" "}
                      <Text className="font-normal text-gray-400">
                        (Optional)
                      </Text>
                    </Text>
                    <TextInput
                      className="rounded-lg border border-gray-200 bg-white/70 px-3 py-2.5 text-base text-gray-900"
                      value={orgName}
                      onChangeText={setOrgName}
                      placeholder="Your organization or ensemble"
                      placeholderTextColor="#9CA3AF"
                      autoCapitalize="words"
                      autoComplete="organization"
                    />
                  </View>

                  <Pressable
                    className={`mt-1 items-center rounded-xl px-4 py-3 ${
                      canSubmit ? "bg-[#9C1738]" : "bg-zinc-400"
                    }`}
                    disabled={!canSubmit}
                    onPress={() => {
                      const trimmedOrg = orgName.trim();
                      joinWaitlist.mutate({
                        firstName: firstName.trim(),
                        lastName: lastName.trim(),
                        organizationName: trimmedOrg || undefined,
                        email: email.trim().toLowerCase(),
                        city: city.trim(),
                        source: "mobile",
                      });
                    }}
                  >
                    <Text className="text-base font-semibold text-white">
                      {joinWaitlist.isPending ? "Joining..." : "Join Waitlist"}
                    </Text>
                  </Pressable>

                  {result === "already_joined" && (
                    <Text className="text-center text-sm text-gray-500">
                      This email is already on the waitlist.
                    </Text>
                  )}
                  {joinWaitlist.error && (
                    <Text className="text-center text-sm text-red-600">
                      Could not join right now. Please try again.
                    </Text>
                  )}
                </View>
              )}
            </View>

            <View className="mt-8 w-full flex-row gap-3">
              {STATS.map((stat) => (
                <View
                  key={stat.value}
                  className="flex-1 items-center rounded-2xl border border-white/70 bg-white/80 px-3 py-3 shadow-sm"
                >
                  <Text className="text-center font-semibold text-gray-900">
                    {stat.value}
                  </Text>
                  <Text className="mt-0.5 text-center text-xs text-gray-500">
                    {stat.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
