import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { Difficulty, Genre } from "~/components/event-form-options";
import type { RouterOutputs } from "~/utils/api";
import {
  DIFFICULTIES,
  GENRES,
  localDateTimeParts,
  TIME_OPTIONS,
} from "~/components/event-form-options";
import { radius, usePalette } from "~/theme";
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

export default function EditHostedEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { palette } = usePalette();
  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (!session?.user) {
      router.replace(toSignInHref(`/post-event/${id}/edit`));
    }
  }, [router, session?.user, id]);

  const { data: event, isPending } = useQuery({
    ...trpc.event.byId.queryOptions({ id }),
    enabled: !!id && !!session?.user,
  });

  if (isPending || !session?.user) {
    return (
      <Centered palette={palette}>
        <Text style={{ fontSize: 13, color: palette.mutedForeground }}>
          Loading…
        </Text>
      </Centered>
    );
  }

  if (!event) {
    return (
      <Centered palette={palette}>
        <Text style={{ fontSize: 13, color: palette.mutedForeground }}>
          This event could not be found.
        </Text>
      </Centered>
    );
  }

  if (event.publicationStatus === "cancelled") {
    return (
      <Centered palette={palette}>
        <Text style={{ fontSize: 13, color: palette.mutedForeground }}>
          This event has been cancelled and can no longer be edited.
        </Text>
      </Centered>
    );
  }

  return <EditForm event={event} />;
}

function Centered({
  palette,
  children,
}: {
  palette: ReturnType<typeof usePalette>["palette"];
  children: React.ReactNode;
}) {
  return (
    <SafeAreaView
      edges={["bottom"]}
      style={{ flex: 1, backgroundColor: palette.background }}
    >
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
        }}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}

function EditForm({
  event,
}: {
  event: NonNullable<RouterOutputs["event"]["byId"]>;
}) {
  const router = useRouter();
  const { palette } = usePalette();
  const queryClient = useQueryClient();

  const isDark = useColorScheme() === "dark";

  const initial = useMemo(() => {
    const parts = localDateTimeParts(new Date(event.date));
    return {
      title: event.title,
      dateValue: new Date(event.date),
      time: parts.time,
      venue: event.venue,
      venueAddress: event.venueAddress ?? "",
      program: event.program,
      description: event.description,
      genre: event.genre,
      difficulty: event.difficulty,
      imageUrl: event.imageUrl ?? "",
      ticketUrl: event.ticketUrl ?? "",
      isFree: event.isFree,
      price: event.isFree ? "" : (event.discountedPriceCents / 100).toFixed(2),
    };
  }, [event]);

  const [title, setTitle] = useState(initial.title);
  const [dateValue, setDateValue] = useState(initial.dateValue);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(initial.time || "19:00");
  const [venue, setVenue] = useState(initial.venue);
  const [venueAddress, setVenueAddress] = useState(initial.venueAddress);
  const [program, setProgram] = useState(initial.program);
  const [description, setDescription] = useState(initial.description);
  const [genre, setGenre] = useState<Genre>(initial.genre);
  const [difficulty, setDifficulty] = useState<Difficulty>(initial.difficulty);
  const [imageUrl, setImageUrl] = useState(initial.imageUrl);
  const [ticketUrl, setTicketUrl] = useState(initial.ticketUrl);
  const [isFree, setIsFree] = useState(initial.isFree);
  const [price, setPrice] = useState(initial.price);
  const [notifySubscribers, setNotifySubscribers] = useState(false);

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

  const updateEvent = useMutation(
    trpc.event.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.event.pathFilter());
        Alert.alert("Event updated");
        router.back();
      },
      onError: (err) => {
        Alert.alert("Error", err.message || "Failed to update event");
      },
    }),
  );

  const cancelEvent = useMutation(
    trpc.event.cancel.mutationOptions({
      onSuccess: async (data) => {
        await queryClient.invalidateQueries(trpc.event.pathFilter());
        Alert.alert(
          "Event cancelled",
          data.emailed > 0
            ? `Emailed ${data.emailed} subscriber(s).`
            : undefined,
        );
        router.back();
      },
      onError: (err) => {
        Alert.alert("Error", err.message || "Could not cancel event");
      },
    }),
  );

  function handleSubmit() {
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
    updateEvent.mutate({
      eventId: event.id,
      notifySubscribers,
      title: title.trim(),
      date: eventDate,
      venue: venue.trim(),
      venueAddress: venueAddress.trim() || undefined,
      program: program.trim(),
      description: description.trim(),
      genre,
      difficulty,
      listingCategory: event.listingCategory,
      imageUrl: imageUrl || undefined,
      ticketUrl: ticketUrl.trim() || undefined,
      isFree,
      priceCents,
    });
  }

  function confirmCancel() {
    Alert.alert(
      "Cancel this event?",
      "This can't be undone. Subscribers will be emailed about the cancellation.",
      [
        { text: "Keep event", style: "cancel" },
        {
          text: "Cancel event",
          style: "destructive",
          onPress: () => cancelEvent.mutate({ eventId: event.id }),
        },
      ],
    );
  }

  const input = {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.input,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 13,
    color: palette.foreground,
  } as const;

  const busy = updateEvent.isPending || cancelEvent.isPending;

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={{ flex: 1, backgroundColor: palette.background }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 14 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={{ fontSize: 13, color: palette.mutedForeground }}>
            Update details or cancel your listing. Subscribers can be emailed
            when you cancel or when you opt in on save.
          </Text>

          <View style={{ alignItems: "center", gap: 8 }}>
            <Pressable
              onPress={() => void handlePickImage()}
              style={{
                width: "100%",
                maxWidth: 288,
                aspectRatio: 1,
                borderRadius: radius.card,
                borderWidth: 1,
                borderStyle: "dashed",
                borderColor: palette.border,
                backgroundColor: palette.secondary,
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
                  <Text
                    style={{ fontSize: 32, color: palette.mutedForeground }}
                  >
                    +
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "500",
                      color: palette.foreground,
                    }}
                  >
                    Upload a poster or photo
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      color: palette.mutedForeground,
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
                    color: palette.mutedForeground,
                    textDecorationLine: "underline",
                  }}
                >
                  Remove image
                </Text>
              </Pressable>
            ) : null}
          </View>

          <Field label="Title" required palette={palette}>
            <TextInput
              value={title}
              onChangeText={setTitle}
              style={input}
              placeholderTextColor={palette.mutedForeground}
            />
          </Field>

          <Field label="Date" required palette={palette}>
            <Pressable onPress={() => setShowDatePicker(true)}>
              <View style={input}>
                <Text style={{ fontSize: 13, color: palette.foreground }}>
                  {formatDateLabel(dateValue)}
                </Text>
              </View>
            </Pressable>
          </Field>

          <Field label="Start time" required palette={palette}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: "row", gap: 6 }}>
                {TIME_OPTIONS.filter((_, i) => i % 2 === 0).map((option) => {
                  const active = option.value === selectedTime;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => setSelectedTime(option.value)}
                      style={{
                        borderRadius: radius.full,
                        borderWidth: 1,
                        borderColor: active ? palette.primary : palette.border,
                        backgroundColor: active
                          ? palette.primary
                          : palette.card,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "600",
                          color: active
                            ? palette.primaryForeground
                            : palette.foreground,
                        }}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </Field>

          <Field label="Venue" required palette={palette}>
            <TextInput
              value={venue}
              onChangeText={setVenue}
              style={input}
              placeholderTextColor={palette.mutedForeground}
            />
          </Field>

          <Field label="Venue address" palette={palette}>
            <TextInput
              value={venueAddress}
              onChangeText={setVenueAddress}
              style={input}
              placeholderTextColor={palette.mutedForeground}
            />
          </Field>

          <Field label="Program" required palette={palette}>
            <TextInput
              value={program}
              onChangeText={setProgram}
              multiline
              style={{ ...input, minHeight: 72 }}
              placeholderTextColor={palette.mutedForeground}
            />
          </Field>

          <Field label="Description" required palette={palette}>
            <TextInput
              value={description}
              onChangeText={setDescription}
              multiline
              style={{ ...input, minHeight: 96 }}
              placeholderTextColor={palette.mutedForeground}
            />
          </Field>

          <Field label="Genre" palette={palette}>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {GENRES.map((option) => {
                const active = option.value === genre;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setGenre(option.value)}
                    style={{
                      borderRadius: radius.full,
                      borderWidth: 1,
                      borderColor: active ? palette.primary : palette.border,
                      backgroundColor: active ? palette.primary : palette.card,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: active
                          ? palette.primaryForeground
                          : palette.foreground,
                      }}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Field>

          <Field label="Difficulty" palette={palette}>
            <View style={{ flexDirection: "row", gap: 6 }}>
              {DIFFICULTIES.map((option) => {
                const active = option.value === difficulty;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setDifficulty(option.value)}
                    style={{
                      borderRadius: radius.full,
                      borderWidth: 1,
                      borderColor: active ? palette.primary : palette.border,
                      backgroundColor: active ? palette.primary : palette.card,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: active
                          ? palette.primaryForeground
                          : palette.foreground,
                      }}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Field>

          <Field label="Ticket / RSVP link" palette={palette}>
            <TextInput
              value={ticketUrl}
              onChangeText={setTicketUrl}
              autoCapitalize="none"
              placeholder="https://…"
              style={input}
              placeholderTextColor={palette.mutedForeground}
            />
          </Field>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "500",
                color: palette.foreground,
              }}
            >
              Free event
            </Text>
            <Switch value={isFree} onValueChange={setIsFree} />
          </View>

          {!isFree && (
            <Field label="Ticket price (USD)" required palette={palette}>
              <TextInput
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
                placeholder="25.00"
                style={input}
                placeholderTextColor={palette.mutedForeground}
              />
            </Field>
          )}

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text
              style={{
                flex: 1,
                fontSize: 13,
                fontWeight: "500",
                color: palette.foreground,
              }}
            >
              Email subscribers about this update
            </Text>
            <Switch
              value={notifySubscribers}
              onValueChange={setNotifySubscribers}
            />
          </View>

          <Pressable
            onPress={handleSubmit}
            disabled={busy}
            style={{
              marginTop: 6,
              alignItems: "center",
              borderRadius: radius.lg,
              backgroundColor: palette.primary,
              paddingVertical: 14,
              opacity: busy ? 0.6 : 1,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: palette.primaryForeground,
              }}
            >
              {updateEvent.isPending ? "Saving…" : "Save changes"}
            </Text>
          </Pressable>

          <Pressable
            onPress={confirmCancel}
            disabled={busy}
            style={{
              alignItems: "center",
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: palette.destructive,
              paddingVertical: 14,
              opacity: busy ? 0.6 : 1,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: palette.destructive,
              }}
            >
              {cancelEvent.isPending ? "Cancelling…" : "Cancel event"}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

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
                        color: palette.foreground,
                      }}
                    >
                      Select Date
                    </Text>
                    <Pressable onPress={() => setShowDatePicker(false)}>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "500",
                          color: palette.primary,
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
    </SafeAreaView>
  );
}

function Field({
  label,
  required,
  palette,
  children,
}: {
  label: string;
  required?: boolean;
  palette: ReturnType<typeof usePalette>["palette"];
  children: React.ReactNode;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text
        style={{ fontSize: 13, fontWeight: "500", color: palette.foreground }}
      >
        {label}
        {required && <Text style={{ color: palette.primary }}> *</Text>}
      </Text>
      {children}
    </View>
  );
}
