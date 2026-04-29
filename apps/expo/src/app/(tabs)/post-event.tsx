import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const GENRES = [
  "orchestral",
  "opera",
  "chamber",
  "solo_recital",
  "choral",
  "ballet",
  "jazz",
] as const;

const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;
const CATEGORIES = ["local", "concert"] as const;

export default function PostEventScreen() {
  const isDark = useColorScheme() === "dark";
  const [title, setTitle] = useState("");
  const [venue, setVenue] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("");
  const [category, setCategory] = useState<string>("");

  const inputClass = isDark
    ? "bg-zinc-800 text-white border-zinc-700"
    : "bg-white text-zinc-900 border-zinc-200";

  return (
    <SafeAreaView className="bg-background flex-1">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="px-4 pt-4 pb-3">
            <Text className="text-foreground text-2xl font-bold tracking-tight">
              Post an Event
            </Text>
            <Text className="text-muted-foreground mt-1 text-sm">
              Share a concert with the Classica community
            </Text>
          </View>

          <View className="gap-4 px-4">
            {/* Title */}
            <Field label="Event Title" required>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Beethoven's Fifth at Carnegie Hall"
                placeholderTextColor={isDark ? "#555" : "#aaa"}
                className={`rounded-xl border px-3 py-3 text-sm ${inputClass}`}
              />
            </Field>

            {/* Venue */}
            <Field label="Venue" required>
              <TextInput
                value={venue}
                onChangeText={setVenue}
                placeholder="Venue name"
                placeholderTextColor={isDark ? "#555" : "#aaa"}
                className={`rounded-xl border px-3 py-3 text-sm ${inputClass}`}
              />
            </Field>

            {/* Date */}
            <Field label="Date & Time" required>
              <TextInput
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD HH:MM"
                placeholderTextColor={isDark ? "#555" : "#aaa"}
                className={`rounded-xl border px-3 py-3 text-sm ${inputClass}`}
              />
            </Field>

            {/* Genre */}
            <Field label="Genre">
              <View className="flex-row flex-wrap gap-2">
                {GENRES.map((g) => (
                  <Pressable
                    key={g}
                    onPress={() => setGenre(genre === g ? "" : g)}
                    className="active:opacity-70"
                  >
                    <View
                      className={`rounded-full px-3 py-1.5 ${
                        genre === g
                          ? "bg-primary"
                          : isDark
                            ? "border border-zinc-700 bg-zinc-800"
                            : "border border-zinc-200 bg-white"
                      }`}
                    >
                      <Text
                        className={`text-xs font-medium capitalize ${
                          genre === g ? "text-white" : "text-muted-foreground"
                        }`}
                      >
                        {g.replace("_", " ")}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </Field>

            {/* Difficulty */}
            <Field label="Audience Level">
              <View className="flex-row gap-2">
                {DIFFICULTIES.map((d) => (
                  <Pressable
                    key={d}
                    onPress={() => setDifficulty(difficulty === d ? "" : d)}
                    className="flex-1 active:opacity-70"
                  >
                    <View
                      className={`items-center rounded-xl py-2.5 ${
                        difficulty === d
                          ? "bg-primary"
                          : isDark
                            ? "border border-zinc-700 bg-zinc-800"
                            : "border border-zinc-200 bg-white"
                      }`}
                    >
                      <Text
                        className={`text-xs font-medium capitalize ${
                          difficulty === d
                            ? "text-white"
                            : "text-muted-foreground"
                        }`}
                      >
                        {d}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </Field>

            {/* Category */}
            <Field label="Category">
              <View className="flex-row gap-2">
                {CATEGORIES.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setCategory(category === c ? "" : c)}
                    className="flex-1 active:opacity-70"
                  >
                    <View
                      className={`items-center rounded-xl py-2.5 ${
                        category === c
                          ? "bg-primary"
                          : isDark
                            ? "border border-zinc-700 bg-zinc-800"
                            : "border border-zinc-200 bg-white"
                      }`}
                    >
                      <Text
                        className={`text-xs font-medium capitalize ${
                          category === c
                            ? "text-white"
                            : "text-muted-foreground"
                        }`}
                      >
                        {c}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </Field>

            {/* Description */}
            <Field label="Description" required>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Tell the community about this concert…"
                placeholderTextColor={isDark ? "#555" : "#aaa"}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                className={`min-h-[100px] rounded-xl border px-3 py-3 text-sm ${inputClass}`}
              />
            </Field>

            {/* Submit */}
            <Pressable
              onPress={() => {
                // TODO: wire up trpc.event.create mutation
              }}
              className="active:opacity-80"
            >
              <View className="bg-primary flex-row items-center justify-center gap-2 rounded-2xl py-4">
                <Ionicons name="add-circle-outline" size={18} color="white" />
                <Text className="text-base font-semibold text-white">
                  Post Event
                </Text>
              </View>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-1.5">
      <Text className="text-foreground text-sm font-medium">
        {label}
        {required && <Text className="text-primary"> *</Text>}
      </Text>
      {children}
    </View>
  );
}
