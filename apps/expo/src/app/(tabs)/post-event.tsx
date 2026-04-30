import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { trpc } from "~/utils/api";
import { authClient } from "~/utils/auth";

const GENRES = [
  { value: "solo_recital", label: "Solo Recital" },
  { value: "chamber", label: "Chamber Music" },
  { value: "orchestral", label: "Orchestral" },
  { value: "opera", label: "Opera" },
  { value: "choral", label: "Choral" },
  { value: "ballet", label: "Ballet" },
  { value: "jazz", label: "Jazz" },
] as const;

const DIFFICULTIES = [
  { value: "beginner", label: "Beginner Friendly" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
] as const;

type Genre = (typeof GENRES)[number]["value"];
type Difficulty = (typeof DIFFICULTIES)[number]["value"];

const TIME_OPTIONS = Array.from({ length: 24 * 4 }, (_, i) => {
  const totalMinutes = i * 15;
  const hour24 = Math.floor(totalMinutes / 60);
  const minute = String(totalMinutes % 60).padStart(2, "0");
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return {
    value: `${String(hour24).padStart(2, "0")}:${minute}`,
    label: `${hour12}:${minute} ${period}`,
  };
});

export default function PostEventScreen() {
  const isDark = useColorScheme() === "dark";
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const isSignedIn = !!session?.user;

  const [title, setTitle] = useState("");
  const [venue, setVenue] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  const [date, setDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("19:00");
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [program, setProgram] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState<Genre>("solo_recital");
  const [difficulty, setDifficulty] = useState<Difficulty>("beginner");
  const [category, setCategory] = useState<"local" | "concert">("local");
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState("");
  const [ticketUrl, setTicketUrl] = useState("");

  const hostedQuery = useQuery({
    ...trpc.event.myHosted.queryOptions(),
    enabled: isSignedIn,
  });

  const createEvent = useMutation(
    trpc.event.create.mutationOptions({
      onSuccess: async () => {
        Alert.alert("Event posted!", "Your event is now live.");
        await queryClient.invalidateQueries(trpc.event.pathFilter());
        router.push("/events");
      },
      onError: (err) => {
        Alert.alert("Error", err.message || "Failed to post event");
      },
    }),
  );

  function handleSubmit() {
    if (!isSignedIn) {
      Alert.alert("Sign in required", "Please sign in to post an event.");
      return;
    }
    if (
      !title.trim() ||
      !date.trim() ||
      !venue.trim() ||
      !program.trim() ||
      !description.trim()
    ) {
      Alert.alert("Missing fields", "Please fill in all required fields (*).");
      return;
    }
    const eventDate = new Date(`${date.trim()}T${selectedTime}:00`);
    if (isNaN(eventDate.getTime())) {
      Alert.alert(
        "Invalid date",
        "Please enter the date in YYYY-MM-DD format.",
      );
      return;
    }
    let priceCents: number | undefined;
    if (!isFree) {
      const parsed = parseFloat(price);
      if (!isFinite(parsed) || parsed < 0) {
        Alert.alert("Invalid price", "Enter a valid ticket price.");
        return;
      }
      priceCents = Math.round(parsed * 100);
    }
    createEvent.mutate({
      title: title.trim(),
      date: eventDate,
      venue: venue.trim(),
      venueAddress: venueAddress.trim() || undefined,
      program: program.trim(),
      description: description.trim(),
      genre,
      difficulty,
      listingCategory: category,
      ticketUrl: ticketUrl.trim() || undefined,
      isFree,
      priceCents,
    });
  }

  const inputClass = isDark
    ? "bg-zinc-800 text-white border-zinc-700"
    : "bg-white text-zinc-900 border-zinc-200";

  const timeLabel =
    TIME_OPTIONS.find((o) => o.value === selectedTime)?.label ?? selectedTime;

  return (
    <SafeAreaView className="bg-background flex-1">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 40 }}
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

          {/* Sign-in banner */}
          {!isSignedIn && (
            <View className="mx-4 mb-4 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/30">
              <Text className="text-sm font-medium text-amber-900 dark:text-amber-200">
                Sign in to post an event
              </Text>
            </View>
          )}

          {/* My Hosted Events */}
          {isSignedIn &&
            hostedQuery.data &&
            hostedQuery.data.length > 0 && (
              <View className="mx-4 mb-4 rounded-2xl border bg-card p-4 shadow-sm">
                <Text className="text-foreground mb-3 text-sm font-semibold">
                  My Hosted Events
                </Text>
                {hostedQuery.data.map((ev) => (
                  <View
                    key={ev.id}
                    className="mb-2 flex-row items-center justify-between"
                  >
                    <View className="mr-2 flex-1">
                      <Text
                        className="text-foreground text-sm font-medium"
                        numberOfLines={1}
                      >
                        {ev.title}
                      </Text>
                      <Text className="text-muted-foreground text-xs">
                        {new Date(ev.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </Text>
                    </View>
                    {ev.publicationStatus === "cancelled" && (
                      <View className="rounded-full bg-red-100 px-2 py-0.5 dark:bg-red-900/30">
                        <Text className="text-xs font-medium text-red-700 dark:text-red-300">
                          Cancelled
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

          <View className="gap-4 px-4">
            {/* Title */}
            <Field label="Event Title" required>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Senior Piano Recital"
                placeholderTextColor={isDark ? "#555" : "#aaa"}
                className={`rounded-xl border px-3 py-3 text-sm ${inputClass}`}
              />
            </Field>

            {/* Date + Time */}
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Field label="Date" required>
                  <TextInput
                    value={date}
                    onChangeText={setDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={isDark ? "#555" : "#aaa"}
                    keyboardType="numbers-and-punctuation"
                    className={`rounded-xl border px-3 py-3 text-sm ${inputClass}`}
                  />
                </Field>
              </View>
              <View className="flex-1">
                <Field label="Time" required>
                  <Pressable
                    onPress={() => setShowTimePicker(true)}
                    className={`rounded-xl border px-3 py-3 ${isDark ? "border-zinc-700 bg-zinc-800" : "border-zinc-200 bg-white"}`}
                  >
                    <Text
                      className={`text-sm ${isDark ? "text-white" : "text-zinc-900"}`}
                    >
                      {timeLabel}
                    </Text>
                  </Pressable>
                </Field>
              </View>
            </View>

            {/* Venue */}
            <Field label="Venue" required>
              <TextInput
                value={venue}
                onChangeText={setVenue}
                placeholder="e.g. Weill Recital Hall"
                placeholderTextColor={isDark ? "#555" : "#aaa"}
                className={`rounded-xl border px-3 py-3 text-sm ${inputClass}`}
              />
            </Field>

            {/* Venue Address */}
            <Field label="Venue Address">
              <TextInput
                value={venueAddress}
                onChangeText={setVenueAddress}
                placeholder="e.g. 154 W 57th St, New York, NY"
                placeholderTextColor={isDark ? "#555" : "#aaa"}
                className={`rounded-xl border px-3 py-3 text-sm ${inputClass}`}
              />
            </Field>

            {/* Genre */}
            <Field label="Genre" required>
              <View className="flex-row flex-wrap gap-2">
                {GENRES.map((g) => (
                  <Pressable
                    key={g.value}
                    onPress={() => setGenre(g.value)}
                    className="active:opacity-70"
                  >
                    <View
                      className={`rounded-full px-3 py-1.5 ${
                        genre === g.value
                          ? "bg-primary"
                          : isDark
                            ? "border border-zinc-700 bg-zinc-800"
                            : "border border-zinc-200 bg-white"
                      }`}
                    >
                      <Text
                        className={`text-xs font-medium ${
                          genre === g.value
                            ? "text-white"
                            : "text-muted-foreground"
                        }`}
                      >
                        {g.label}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </Field>

            {/* Audience Level */}
            <Field label="Audience Level" required>
              <View className="flex-row gap-2">
                {DIFFICULTIES.map((d) => (
                  <Pressable
                    key={d.value}
                    onPress={() => setDifficulty(d.value)}
                    className="flex-1 active:opacity-70"
                  >
                    <View
                      className={`items-center rounded-xl py-2.5 ${
                        difficulty === d.value
                          ? "bg-primary"
                          : isDark
                            ? "border border-zinc-700 bg-zinc-800"
                            : "border border-zinc-200 bg-white"
                      }`}
                    >
                      <Text
                        className={`text-xs font-medium ${
                          difficulty === d.value
                            ? "text-white"
                            : "text-muted-foreground"
                        }`}
                      >
                        {d.label}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </Field>

            {/* Category */}
            <Field label="Category">
              <View className="flex-row gap-2">
                {(
                  [
                    { value: "local", label: "Local / Community" },
                    { value: "concert", label: "Concert" },
                  ] as const
                ).map((c) => (
                  <Pressable
                    key={c.value}
                    onPress={() => setCategory(c.value)}
                    className="flex-1 active:opacity-70"
                  >
                    <View
                      className={`items-center rounded-xl py-2.5 ${
                        category === c.value
                          ? "bg-primary"
                          : isDark
                            ? "border border-zinc-700 bg-zinc-800"
                            : "border border-zinc-200 bg-white"
                      }`}
                    >
                      <Text
                        className={`text-xs font-medium ${
                          category === c.value
                            ? "text-white"
                            : "text-muted-foreground"
                        }`}
                      >
                        {c.label}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </Field>

            {/* Program */}
            <Field label="Program" required>
              <TextInput
                value={program}
                onChangeText={setProgram}
                placeholder={
                  'e.g.\nBeethoven - Piano Sonata No. 14 "Moonlight"\nChopin - Ballade No. 1 in G minor'
                }
                placeholderTextColor={isDark ? "#555" : "#aaa"}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                className={`min-h-[100px] rounded-xl border px-3 py-3 text-sm ${inputClass}`}
              />
            </Field>

            {/* Description */}
            <Field label="Description" required>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Tell attendees about this event — what to expect, any special notes..."
                placeholderTextColor={isDark ? "#555" : "#aaa"}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                className={`min-h-[100px] rounded-xl border px-3 py-3 text-sm ${inputClass}`}
              />
            </Field>

            {/* Tickets */}
            <Field label="Tickets">
              <Pressable
                onPress={() => setIsFree(!isFree)}
                className="flex-row items-center gap-2 py-1"
              >
                <View
                  className={`h-5 w-5 items-center justify-center rounded border ${
                    isFree
                      ? "border-primary bg-primary"
                      : isDark
                        ? "border-zinc-600 bg-zinc-800"
                        : "border-zinc-300 bg-white"
                  }`}
                >
                  {isFree && (
                    <Ionicons name="checkmark" size={12} color="white" />
                  )}
                </View>
                <Text className="text-foreground text-sm">
                  This event is free
                </Text>
              </Pressable>
              {!isFree && (
                <View className="mt-2 gap-1.5">
                  <Text className="text-foreground text-xs font-medium">
                    Ticket price (USD) *
                  </Text>
                  <TextInput
                    value={price}
                    onChangeText={setPrice}
                    placeholder="e.g. 15.00"
                    placeholderTextColor={isDark ? "#555" : "#aaa"}
                    keyboardType="decimal-pad"
                    className={`rounded-xl border px-3 py-3 text-sm ${inputClass}`}
                  />
                  <Text className="text-muted-foreground text-xs">
                    Attendees will pay this price through Classica checkout.
                  </Text>
                </View>
              )}
              {isFree && (
                <Text className="text-muted-foreground mt-1 text-xs">
                  Attendees won't see a checkout button — just event details.
                </Text>
              )}
            </Field>

            {/* Ticket URL */}
            <Field label="Ticket / RSVP Link">
              <TextInput
                value={ticketUrl}
                onChangeText={setTicketUrl}
                placeholder="https://..."
                placeholderTextColor={isDark ? "#555" : "#aaa"}
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
                className={`rounded-xl border px-3 py-3 text-sm ${inputClass}`}
              />
              <Text className="text-muted-foreground text-xs">
                External link where people can get tickets or RSVP
              </Text>
            </Field>

            {/* Submit */}
            <Pressable
              onPress={handleSubmit}
              disabled={createEvent.isPending}
              className="active:opacity-80"
            >
              <View
                className={`flex-row items-center justify-center gap-2 rounded-2xl py-4 ${
                  createEvent.isPending ? "bg-primary/60" : "bg-primary"
                }`}
              >
                {createEvent.isPending ? (
                  <Text className="text-base font-semibold text-white">
                    Posting...
                  </Text>
                ) : (
                  <>
                    <Ionicons
                      name="add-circle-outline"
                      size={18}
                      color="white"
                    />
                    <Text className="text-base font-semibold text-white">
                      Post Event
                    </Text>
                  </>
                )}
              </View>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Time picker modal */}
      <Modal
        visible={showTimePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <Pressable
          className="flex-1 justify-end bg-black/40"
          onPress={() => setShowTimePicker(false)}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View
              className={`rounded-t-2xl px-4 pb-8 pt-4 ${isDark ? "bg-zinc-900" : "bg-white"}`}
            >
              <View className="mb-3 flex-row items-center justify-between">
                <Text className="text-foreground text-base font-semibold">
                  Select Time
                </Text>
                <Pressable onPress={() => setShowTimePicker(false)}>
                  <Text className="text-primary text-sm font-medium">Done</Text>
                </Pressable>
              </View>
              <ScrollView
                style={{ maxHeight: 260 }}
                showsVerticalScrollIndicator={false}
              >
                {TIME_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() => {
                      setSelectedTime(opt.value);
                      setShowTimePicker(false);
                    }}
                    className="active:opacity-60"
                  >
                    <View
                      className={`rounded-lg px-3 py-3 ${
                        selectedTime === opt.value
                          ? "bg-primary/10"
                          : "bg-transparent"
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          selectedTime === opt.value
                            ? "text-primary"
                            : "text-foreground"
                        }`}
                      >
                        {opt.label}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
