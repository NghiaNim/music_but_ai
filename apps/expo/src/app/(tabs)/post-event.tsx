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
import { toSignInHref } from "~/utils/auth-redirect";
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
  { value: "beginner", label: "Beginner" },
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

  // ── Theme tokens ────────────────────────────────────────────────────────────
  const bg = isDark ? "#09090B" : "#FAFAF9";
  const card = isDark ? "#1A1A1A" : "#FFFFFF";
  const cardBorder = isDark ? "#27272A" : "#E4E4E7";
  const textPrimary = isDark ? "#F9FAFB" : "#111827";
  const textMuted = "#6B7280";
  const inputBg = isDark ? "#1C1C1C" : "#FFFFFF";
  const inputBorder = isDark ? "#3F3F46" : "#D4D4D8";
  const primary = "#9C1738";

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
      router.push(toSignInHref("/(tabs)/post-event"));
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

  const timeLabel =
    TIME_OPTIONS.find((o) => o.value === selectedTime)?.label ?? selectedTime;

  // ── Sign-in gate ────────────────────────────────────────────────────────────
  if (!isSignedIn) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 32,
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: isDark ? "#27272A" : "#F4F4F5",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
            }}
          >
            <Ionicons name="calendar-outline" size={28} color={primary} />
          </View>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: textPrimary,
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            Post an Event
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: textMuted,
              textAlign: "center",
              lineHeight: 20,
              marginBottom: 28,
            }}
          >
            Sign in to share a concert with the Classica community.
          </Text>
          <Pressable
            onPress={() => router.push(toSignInHref("/(tabs)/post-event"))}
            style={{ width: "100%" }}
          >
            <View
              style={{
                alignItems: "center",
                borderRadius: 14,
                backgroundColor: primary,
                paddingVertical: 14,
              }}
            >
              <Text
                style={{ fontSize: 15, fontWeight: "600", color: "#FFFFFF" }}
              >
                Sign in
              </Text>
            </View>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
            <Text
              style={{
                fontSize: 24,
                fontWeight: "700",
                color: textPrimary,
                letterSpacing: -0.5,
              }}
            >
              Post an Event
            </Text>
            <Text style={{ fontSize: 13, color: textMuted, marginTop: 4 }}>
              Share a concert with the Classica community
            </Text>
          </View>

          {/* My Hosted Events */}
          {hostedQuery.data &&
            hostedQuery.data.length > 0 && (
              <View
                style={{
                  marginHorizontal: 16,
                  marginBottom: 16,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: cardBorder,
                  backgroundColor: card,
                  padding: 16,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: textPrimary,
                    marginBottom: 12,
                  }}
                >
                  My Hosted Events
                </Text>
                {hostedQuery.data.map((ev) => (
                  <View
                    key={ev.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "500",
                          color: textPrimary,
                        }}
                        numberOfLines={1}
                      >
                        {ev.title}
                      </Text>
                      <Text style={{ fontSize: 11, color: textMuted, marginTop: 1 }}>
                        {new Date(ev.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </Text>
                    </View>
                    {ev.publicationStatus === "cancelled" && (
                      <View
                        style={{
                          borderRadius: 999,
                          backgroundColor: isDark ? "#450A0A" : "#FEE2E2",
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "500",
                            color: isDark ? "#FCA5A5" : "#991B1B",
                          }}
                        >
                          Cancelled
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

          {/* Form fields */}
          <View style={{ paddingHorizontal: 16, gap: 20 }}>
            {/* Title */}
            <Field label="Event Title" required textPrimary={textPrimary} primary={primary}>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Senior Piano Recital"
                placeholderTextColor={isDark ? "#555" : "#aaa"}
                style={[inputStyle(inputBg, inputBorder, textPrimary)]}
              />
            </Field>

            {/* Date + Time */}
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Field label="Date" required textPrimary={textPrimary} primary={primary}>
                  <TextInput
                    value={date}
                    onChangeText={setDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={isDark ? "#555" : "#aaa"}
                    keyboardType="numbers-and-punctuation"
                    style={inputStyle(inputBg, inputBorder, textPrimary)}
                  />
                </Field>
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Time" required textPrimary={textPrimary} primary={primary}>
                  <Pressable onPress={() => setShowTimePicker(true)}>
                    <View
                      style={{
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: inputBorder,
                        backgroundColor: inputBg,
                        paddingHorizontal: 12,
                        paddingVertical: 12,
                      }}
                    >
                      <Text style={{ fontSize: 13, color: textPrimary }}>
                        {timeLabel}
                      </Text>
                    </View>
                  </Pressable>
                </Field>
              </View>
            </View>

            {/* Venue */}
            <Field label="Venue" required textPrimary={textPrimary} primary={primary}>
              <TextInput
                value={venue}
                onChangeText={setVenue}
                placeholder="e.g. Weill Recital Hall"
                placeholderTextColor={isDark ? "#555" : "#aaa"}
                style={inputStyle(inputBg, inputBorder, textPrimary)}
              />
            </Field>

            {/* Venue Address */}
            <Field label="Venue Address" textPrimary={textPrimary} primary={primary}>
              <TextInput
                value={venueAddress}
                onChangeText={setVenueAddress}
                placeholder="e.g. 154 W 57th St, New York, NY"
                placeholderTextColor={isDark ? "#555" : "#aaa"}
                style={inputStyle(inputBg, inputBorder, textPrimary)}
              />
            </Field>

            {/* Genre */}
            <Field label="Genre" required textPrimary={textPrimary} primary={primary}>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {GENRES.map((g) => (
                  <Pressable
                    key={g.value}
                    onPress={() => setGenre(g.value)}
                    style={{ opacity: 1 }}
                  >
                    <View
                      style={{
                        borderRadius: 999,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        backgroundColor:
                          genre === g.value
                            ? primary
                            : isDark
                              ? "#27272A"
                              : "#F4F4F5",
                        borderWidth: genre === g.value ? 0 : 1,
                        borderColor: isDark ? "#3F3F46" : "#D4D4D8",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "500",
                          color:
                            genre === g.value
                              ? "#FFFFFF"
                              : textMuted,
                        }}
                      >
                        {g.label}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </Field>

            {/* Audience Level */}
            <Field label="Audience Level" required textPrimary={textPrimary} primary={primary}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {DIFFICULTIES.map((d) => (
                  <Pressable
                    key={d.value}
                    onPress={() => setDifficulty(d.value)}
                    style={{ flex: 1 }}
                  >
                    <View
                      style={{
                        alignItems: "center",
                        borderRadius: 12,
                        paddingVertical: 10,
                        backgroundColor:
                          difficulty === d.value
                            ? primary
                            : isDark
                              ? "#27272A"
                              : "#F4F4F5",
                        borderWidth: difficulty === d.value ? 0 : 1,
                        borderColor: isDark ? "#3F3F46" : "#D4D4D8",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "500",
                          color:
                            difficulty === d.value ? "#FFFFFF" : textMuted,
                        }}
                      >
                        {d.label}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </Field>

            {/* Category */}
            <Field label="Category" textPrimary={textPrimary} primary={primary}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {(
                  [
                    { value: "local" as const, label: "Local" },
                    { value: "concert" as const, label: "Concert" },
                  ]
                ).map((c) => (
                  <Pressable
                    key={c.value}
                    onPress={() => setCategory(c.value)}
                    style={{ flex: 1 }}
                  >
                    <View
                      style={{
                        alignItems: "center",
                        borderRadius: 12,
                        paddingVertical: 10,
                        backgroundColor:
                          category === c.value
                            ? primary
                            : isDark
                              ? "#27272A"
                              : "#F4F4F5",
                        borderWidth: category === c.value ? 0 : 1,
                        borderColor: isDark ? "#3F3F46" : "#D4D4D8",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "500",
                          color:
                            category === c.value ? "#FFFFFF" : textMuted,
                        }}
                      >
                        {c.label}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </Field>

            {/* Program */}
            <Field label="Program" required textPrimary={textPrimary} primary={primary}>
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
                style={[
                  inputStyle(inputBg, inputBorder, textPrimary),
                  { minHeight: 100 },
                ]}
              />
            </Field>

            {/* Description */}
            <Field label="Description" required textPrimary={textPrimary} primary={primary}>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Tell attendees about this event — what to expect, any special notes..."
                placeholderTextColor={isDark ? "#555" : "#aaa"}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={[
                  inputStyle(inputBg, inputBorder, textPrimary),
                  { minHeight: 100 },
                ]}
              />
            </Field>

            {/* Tickets */}
            <Field label="Tickets" textPrimary={textPrimary} primary={primary}>
              <Pressable
                onPress={() => setIsFree(!isFree)}
                style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4 }}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    borderWidth: 1.5,
                    borderColor: isFree ? primary : inputBorder,
                    backgroundColor: isFree ? primary : inputBg,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {isFree && (
                    <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                  )}
                </View>
                <Text style={{ fontSize: 13, color: textPrimary }}>
                  This event is free
                </Text>
              </Pressable>
              {!isFree && (
                <View style={{ marginTop: 8, gap: 6 }}>
                  <Text style={{ fontSize: 11, fontWeight: "500", color: textPrimary }}>
                    Ticket price (USD) *
                  </Text>
                  <TextInput
                    value={price}
                    onChangeText={setPrice}
                    placeholder="e.g. 15.00"
                    placeholderTextColor={isDark ? "#555" : "#aaa"}
                    keyboardType="decimal-pad"
                    style={inputStyle(inputBg, inputBorder, textPrimary)}
                  />
                  <Text style={{ fontSize: 11, color: textMuted }}>
                    Attendees will pay this price through Classica checkout.
                  </Text>
                </View>
              )}
              {isFree && (
                <Text style={{ fontSize: 11, color: textMuted, marginTop: 4 }}>
                  Attendees won't see a checkout button — just event details.
                </Text>
              )}
            </Field>

            {/* Ticket URL */}
            <Field label="Ticket / RSVP Link" textPrimary={textPrimary} primary={primary}>
              <TextInput
                value={ticketUrl}
                onChangeText={setTicketUrl}
                placeholder="https://..."
                placeholderTextColor={isDark ? "#555" : "#aaa"}
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
                style={inputStyle(inputBg, inputBorder, textPrimary)}
              />
              <Text style={{ fontSize: 11, color: textMuted, marginTop: 2 }}>
                External link where people can get tickets or RSVP
              </Text>
            </Field>

            {/* Submit */}
            <Pressable
              onPress={handleSubmit}
              disabled={createEvent.isPending}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  borderRadius: 16,
                  paddingVertical: 16,
                  backgroundColor: createEvent.isPending
                    ? primary + "99"
                    : primary,
                }}
              >
                {createEvent.isPending ? (
                  <Text style={{ fontSize: 15, fontWeight: "600", color: "#FFFFFF" }}>
                    Posting...
                  </Text>
                ) : (
                  <>
                    <Ionicons
                      name="add-circle-outline"
                      size={18}
                      color="#FFFFFF"
                    />
                    <Text style={{ fontSize: 15, fontWeight: "600", color: "#FFFFFF" }}>
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
          onPress={() => setShowTimePicker(false)}
          style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" }}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View
              style={{
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                backgroundColor: isDark ? "#18181B" : "#FFFFFF",
                paddingHorizontal: 16,
                paddingTop: 16,
                paddingBottom: 40,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: "600", color: textPrimary }}>
                  Select Time
                </Text>
                <Pressable onPress={() => setShowTimePicker(false)}>
                  <Text style={{ fontSize: 13, fontWeight: "500", color: primary }}>
                    Done
                  </Text>
                </Pressable>
              </View>
              <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
                {TIME_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() => {
                      setSelectedTime(opt.value);
                      setShowTimePicker(false);
                    }}
                  >
                    <View
                      style={{
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 12,
                        backgroundColor:
                          selectedTime === opt.value
                            ? primary + "18"
                            : "transparent",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "500",
                          color:
                            selectedTime === opt.value ? primary : textPrimary,
                        }}
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

function inputStyle(bg: string, border: string, color: string) {
  return {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: border,
    backgroundColor: bg,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 13,
    color,
  };
}

function Field({
  label,
  required,
  textPrimary,
  primary,
  children,
}: {
  label: string;
  required?: boolean;
  textPrimary: string;
  primary: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: 13, fontWeight: "500", color: textPrimary }}>
        {label}
        {required && (
          <Text style={{ color: primary }}> *</Text>
        )}
      </Text>
      {children}
    </View>
  );
}
