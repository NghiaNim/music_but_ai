import { useState } from "react";
import {
  Alert,
  Image,
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
import { BlurView } from "expo-blur";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { Difficulty, Genre } from "~/components/event-form-options";
import {
  DIFFICULTIES,
  GENRES,
  TIME_OPTIONS,
} from "~/components/event-form-options";
import { trpc } from "~/utils/api";
import { authClient } from "~/utils/auth";
import { toSignInHref } from "~/utils/auth-redirect";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

function formatDateLabel(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function PostEventScreen() {
  const isDark = useColorScheme() === "dark";
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const isSignedIn = !!session?.user;

  const [title, setTitle] = useState("");
  const [venue, setVenue] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  const [dateValue, setDateValue] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
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
  const [imageUrl, setImageUrl] = useState("");

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

  async function handlePickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission needed",
        "Allow photo access to upload a poster or photo.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      base64: true,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset?.base64) return;
    const estimatedBytes = asset.fileSize ?? asset.base64.length * 0.75;
    if (estimatedBytes > MAX_IMAGE_BYTES) {
      Alert.alert("Image too large", "Image must be 2 MB or smaller.");
      return;
    }
    const mimeType = asset.mimeType ?? "image/jpeg";
    setImageUrl(`data:${mimeType};base64,${asset.base64}`);
  }

  function handleSubmit() {
    if (!isSignedIn) {
      router.push(toSignInHref("/(tabs)/post-event"));
      return;
    }
    if (
      !title.trim() ||
      !venue.trim() ||
      !program.trim() ||
      !description.trim()
    ) {
      Alert.alert("Missing fields", "Please fill in all required fields (*).");
      return;
    }
    const [hh, mm] = selectedTime.split(":");
    const eventDate = new Date(dateValue);
    eventDate.setHours(Number(hh), Number(mm), 0, 0);
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
      imageUrl: imageUrl || undefined,
      ticketUrl: ticketUrl.trim() || undefined,
      isFree,
      priceCents,
    });
  }

  const timeLabel =
    TIME_OPTIONS.find((o) => o.value === selectedTime)?.label ?? selectedTime;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <View style={{ flex: 1 }}>
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
            <View
              style={{
                paddingHorizontal: 16,
                paddingTop: 16,
                paddingBottom: 12,
              }}
            >
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
            {hostedQuery.data && hostedQuery.data.length > 0 && (
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
                      <Text
                        style={{ fontSize: 11, color: textMuted, marginTop: 1 }}
                      >
                        {new Date(ev.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </Text>
                    </View>
                    {ev.publicationStatus === "cancelled" ? (
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
                    ) : (
                      <Pressable
                        onPress={() => router.push(`/post-event/${ev.id}/edit`)}
                        style={{
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: cardBorder,
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "600",
                            color: primary,
                          }}
                        >
                          Edit
                        </Text>
                      </Pressable>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Form fields */}
            <View style={{ paddingHorizontal: 16, gap: 20 }}>
              {/* Image upload */}
              <View style={{ alignItems: "center", gap: 8 }}>
                <Pressable
                  onPress={() => void handlePickImage()}
                  style={{
                    width: "100%",
                    maxWidth: 288,
                    aspectRatio: 1,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderStyle: "dashed",
                    borderColor: inputBorder,
                    backgroundColor: isDark ? "#18181B" : "#F4F4F5",
                    overflow: "hidden",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {imageUrl ? (
                    <Image
                      source={{ uri: imageUrl }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={{
                        alignItems: "center",
                        gap: 8,
                        paddingHorizontal: 16,
                        paddingVertical: 24,
                      }}
                    >
                      <Text style={{ fontSize: 32, color: textMuted }}>+</Text>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "500",
                          color: textPrimary,
                        }}
                      >
                        Upload a poster or photo
                      </Text>
                      <Text
                        style={{
                          fontSize: 11,
                          color: textMuted,
                          textAlign: "center",
                          maxWidth: 220,
                        }}
                      >
                        Tap to choose — up to 2 MB
                      </Text>
                    </View>
                  )}
                </Pressable>
                {imageUrl ? (
                  <Pressable onPress={() => setImageUrl("")}>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "500",
                        color: textMuted,
                        textDecorationLine: "underline",
                      }}
                    >
                      Remove image
                    </Text>
                  </Pressable>
                ) : null}
              </View>

              {/* Title */}
              <Field
                label="Event Title"
                required
                textPrimary={textPrimary}
                primary={primary}
              >
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
                  <Field
                    label="Date"
                    required
                    textPrimary={textPrimary}
                    primary={primary}
                  >
                    <Pressable onPress={() => setShowDatePicker(true)}>
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
                          {formatDateLabel(dateValue)}
                        </Text>
                      </View>
                    </Pressable>
                  </Field>
                </View>
                <View style={{ flex: 1 }}>
                  <Field
                    label="Time"
                    required
                    textPrimary={textPrimary}
                    primary={primary}
                  >
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
              <Field
                label="Venue"
                required
                textPrimary={textPrimary}
                primary={primary}
              >
                <TextInput
                  value={venue}
                  onChangeText={setVenue}
                  placeholder="e.g. Weill Recital Hall"
                  placeholderTextColor={isDark ? "#555" : "#aaa"}
                  style={inputStyle(inputBg, inputBorder, textPrimary)}
                />
              </Field>

              {/* Venue Address */}
              <Field
                label="Venue Address"
                textPrimary={textPrimary}
                primary={primary}
              >
                <TextInput
                  value={venueAddress}
                  onChangeText={setVenueAddress}
                  placeholder="e.g. 154 W 57th St, New York, NY"
                  placeholderTextColor={isDark ? "#555" : "#aaa"}
                  style={inputStyle(inputBg, inputBorder, textPrimary)}
                />
              </Field>

              {/* Genre */}
              <Field
                label="Genre"
                required
                textPrimary={textPrimary}
                primary={primary}
              >
                <View
                  style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                >
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
                            color: genre === g.value ? "#FFFFFF" : textMuted,
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
              <Field
                label="Audience Level"
                required
                textPrimary={textPrimary}
                primary={primary}
              >
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
              <Field
                label="Category"
                textPrimary={textPrimary}
                primary={primary}
              >
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {[
                    { value: "local" as const, label: "Local" },
                    { value: "concert" as const, label: "Concert" },
                  ].map((c) => (
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
                            color: category === c.value ? "#FFFFFF" : textMuted,
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
              <Field
                label="Program"
                required
                textPrimary={textPrimary}
                primary={primary}
              >
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
              <Field
                label="Description"
                required
                textPrimary={textPrimary}
                primary={primary}
              >
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
              <Field
                label="Tickets"
                textPrimary={textPrimary}
                primary={primary}
              >
                <Pressable
                  onPress={() => setIsFree(!isFree)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    paddingVertical: 4,
                  }}
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
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "500",
                        color: textPrimary,
                      }}
                    >
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
                  <Text
                    style={{ fontSize: 11, color: textMuted, marginTop: 4 }}
                  >
                    Attendees won't see a checkout button — just event details.
                  </Text>
                )}
              </Field>

              {/* Ticket URL */}
              <Field
                label="Ticket / RSVP Link"
                textPrimary={textPrimary}
                primary={primary}
              >
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
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "600",
                        color: "#FFFFFF",
                      }}
                    >
                      Posting...
                    </Text>
                  ) : (
                    <>
                      <Ionicons
                        name="add-circle-outline"
                        size={18}
                        color="#FFFFFF"
                      />
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: "600",
                          color: "#FFFFFF",
                        }}
                      >
                        Post Event
                      </Text>
                    </>
                  )}
                </View>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {!isSignedIn && (
          <BlurView
            intensity={50}
            tint={isDark ? "dark" : "light"}
            style={{
              position: "absolute",
              inset: 0,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 24,
              gap: 12,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: textPrimary,
                textAlign: "center",
              }}
            >
              Sign in to post an event
            </Text>
            <Pressable
              onPress={() => router.push(toSignInHref("/(tabs)/post-event"))}
            >
              <View
                style={{
                  borderRadius: 999,
                  backgroundColor: primary,
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                }}
              >
                <Text
                  style={{ fontSize: 13, fontWeight: "600", color: "#FFFFFF" }}
                >
                  Sign in
                </Text>
              </View>
            </Pressable>
          </BlurView>
        )}

        {/* Time picker modal */}
        <Modal
          visible={showTimePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowTimePicker(false)}
        >
          <Pressable
            onPress={() => setShowTimePicker(false)}
            style={{
              flex: 1,
              justifyContent: "flex-end",
              backgroundColor: "rgba(0,0,0,0.4)",
            }}
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
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "600",
                      color: textPrimary,
                    }}
                  >
                    Select Time
                  </Text>
                  <Pressable onPress={() => setShowTimePicker(false)}>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "500",
                        color: primary,
                      }}
                    >
                      Done
                    </Text>
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
                              selectedTime === opt.value
                                ? primary
                                : textPrimary,
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

        {/* Date picker */}
        {showDatePicker &&
          (Platform.OS === "ios" ? (
            <Modal
              visible={showDatePicker}
              transparent
              animationType="slide"
              onRequestClose={() => setShowDatePicker(false)}
            >
              <Pressable
                onPress={() => setShowDatePicker(false)}
                style={{
                  flex: 1,
                  justifyContent: "flex-end",
                  backgroundColor: "rgba(0,0,0,0.4)",
                }}
              >
                <Pressable onPress={(e) => e.stopPropagation()}>
                  <View
                    style={{
                      borderTopLeftRadius: 20,
                      borderTopRightRadius: 20,
                      backgroundColor: isDark ? "#18181B" : "#FFFFFF",
                      paddingHorizontal: 16,
                      paddingTop: 16,
                      paddingBottom: 24,
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
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: "600",
                          color: textPrimary,
                        }}
                      >
                        Select Date
                      </Text>
                      <Pressable onPress={() => setShowDatePicker(false)}>
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: "500",
                            color: primary,
                          }}
                        >
                          Done
                        </Text>
                      </Pressable>
                    </View>
                    <DateTimePicker
                      value={dateValue}
                      mode="date"
                      display="spinner"
                      onChange={(_event, selected) => {
                        if (selected) setDateValue(selected);
                      }}
                    />
                  </View>
                </Pressable>
              </Pressable>
            </Modal>
          ) : (
            <DateTimePicker
              value={dateValue}
              mode="date"
              display="default"
              onChange={(event, selected) => {
                setShowDatePicker(false);
                if (event.type === "set" && selected) setDateValue(selected);
              }}
            />
          ))}
      </View>
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
        {required && <Text style={{ color: primary }}> *</Text>}
      </Text>
      {children}
    </View>
  );
}
