import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { Palette } from "~/theme";
import type { RouterOutputs } from "~/utils/api";
import { radius, shadowCard, usePalette } from "~/theme";
import { trpc } from "~/utils/api";
import { authClient } from "~/utils/auth";
import { toSignInHref } from "~/utils/auth-redirect";

type UserEventWithEvent = RouterOutputs["userEvent"]["myEvents"][number];

function formatMonthShort(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short" });
}

export default function JournalScreen() {
  const router = useRouter();
  const { palette } = usePalette();
  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (!session?.user) {
      router.replace(toSignInHref("/journal"));
    }
  }, [router, session?.user]);

  const { data: userEvents, isPending } = useQuery({
    ...trpc.userEvent.myEvents.queryOptions(),
    enabled: !!session?.user,
  });

  const saved = userEvents?.filter((ue) => ue.status === "saved") ?? [];
  const attended = userEvents?.filter((ue) => ue.status === "attended") ?? [];

  const stats = {
    attended: attended.length,
    saved: saved.length,
    composers: new Set(
      attended.map((ue) => ue.event.program.split(":")[0]?.trim()),
    ).size,
    venues: new Set(attended.map((ue) => ue.event.venue)).size,
  };

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={{ flex: 1, backgroundColor: palette.background }}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      >
        {isPending ? (
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <View
                  key={i}
                  style={{
                    width: "47%",
                    height: 80,
                    borderRadius: radius.lg,
                    backgroundColor: palette.secondary,
                  }}
                />
              ))}
            </View>
            {Array.from({ length: 3 }).map((_, i) => (
              <View
                key={i}
                style={{
                  height: 80,
                  borderRadius: radius.lg,
                  backgroundColor: palette.secondary,
                }}
              />
            ))}
          </View>
        ) : (
          <>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 12,
                marginBottom: 24,
              }}
            >
              <StatCard
                label="Concerts Attended"
                value={stats.attended}
                palette={palette}
              />
              <StatCard
                label="Events Saved"
                value={stats.saved}
                palette={palette}
              />
              <StatCard
                label="Composers Explored"
                value={stats.composers}
                palette={palette}
              />
              <StatCard
                label="Venues Visited"
                value={stats.venues}
                palette={palette}
              />
            </View>

            {attended.length > 0 && (
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "600",
                    color: palette.foreground,
                    marginBottom: 12,
                  }}
                >
                  Attended
                </Text>
                <View style={{ gap: 12 }}>
                  {attended.map((ue) => (
                    <JournalEntry key={ue.id} userEvent={ue} />
                  ))}
                </View>
              </View>
            )}

            {saved.length > 0 && (
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "600",
                    color: palette.foreground,
                    marginBottom: 12,
                  }}
                >
                  Saved
                </Text>
                <View style={{ gap: 12 }}>
                  {saved.map((ue) => (
                    <JournalEntry key={ue.id} userEvent={ue} />
                  ))}
                </View>
              </View>
            )}

            {!userEvents?.length && (
              <View
                style={{
                  alignItems: "center",
                  gap: 12,
                  paddingVertical: 64,
                }}
              >
                <Text style={{ fontSize: 18, color: palette.mutedForeground }}>
                  Your journal is empty
                </Text>
                <Text style={{ fontSize: 14, color: palette.mutedForeground }}>
                  Start by saving or attending events
                </Text>
                <Pressable
                  onPress={() => router.push("/(tabs)/events")}
                  style={{
                    marginTop: 4,
                    borderRadius: radius.lg,
                    backgroundColor: palette.primary,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                  }}
                >
                  <Text
                    style={{
                      color: palette.primaryForeground,
                      fontSize: 14,
                      fontWeight: "600",
                    }}
                  >
                    Browse Events
                  </Text>
                </Pressable>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function JournalEntry({ userEvent }: { userEvent: UserEventWithEvent }) {
  const router = useRouter();
  const { palette, isDark } = usePalette();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [reflection, setReflection] = useState(userEvent.reflection ?? "");

  const saveReflection = useMutation(
    trpc.userEvent.saveReflection.mutationOptions({
      onSuccess: async () => {
        setEditing(false);
        Alert.alert("Reflection saved!");
        await queryClient.invalidateQueries(trpc.userEvent.pathFilter());
      },
      onError: () => {
        Alert.alert("Failed to save reflection");
      },
    }),
  );

  const date = new Date(userEvent.event.date);
  const isAttended = userEvent.status === "attended";
  const badgeBg = isAttended ? palette.emeraldSoft : palette.amberSoft;
  const badgeText = isAttended
    ? palette.emeraldForeground
    : palette.amberStrong;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: palette.border,
        backgroundColor: palette.card,
        padding: 16,
        ...shadowCard,
      }}
    >
      <View
        style={{
          alignItems: "center",
          borderRadius: radius.lg - 4,
          paddingHorizontal: 12,
          paddingVertical: 8,
          backgroundColor: isDark
            ? "rgba(187,79,94,0.12)"
            : "rgba(156,23,56,0.08)",
        }}
      >
        <Text
          style={{
            fontSize: 12,
            fontWeight: "500",
            color: palette.primary,
            textTransform: "uppercase",
          }}
        >
          {formatMonthShort(date)}
        </Text>
        <Text
          style={{ fontSize: 20, fontWeight: "700", color: palette.primary }}
        >
          {date.getDate()}
        </Text>
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Pressable onPress={() => router.push(`/event/${userEvent.event.id}`)}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: palette.foreground,
            }}
          >
            {userEvent.event.title}
          </Text>
        </Pressable>
        <Text style={{ fontSize: 14, color: palette.mutedForeground }}>
          {userEvent.event.venue}
        </Text>

        {isAttended && (
          <View style={{ marginTop: 8 }}>
            {editing ? (
              <View style={{ gap: 8 }}>
                <TextInput
                  value={reflection}
                  onChangeText={setReflection}
                  placeholder="How was the experience? (280 chars)"
                  placeholderTextColor={palette.mutedForeground}
                  maxLength={280}
                  multiline
                  style={{
                    borderRadius: radius.lg - 4,
                    borderWidth: 1,
                    borderColor: palette.border,
                    backgroundColor: palette.input,
                    color: palette.foreground,
                    fontSize: 14,
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                    minHeight: 40,
                  }}
                />
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Pressable
                    disabled={saveReflection.isPending}
                    onPress={() =>
                      saveReflection.mutate({
                        userEventId: userEvent.id,
                        reflection,
                      })
                    }
                    style={{
                      borderRadius: radius.lg - 4,
                      backgroundColor: palette.primary,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      opacity: saveReflection.isPending ? 0.6 : 1,
                    }}
                  >
                    <Text
                      style={{
                        color: palette.primaryForeground,
                        fontSize: 13,
                        fontWeight: "600",
                      }}
                    >
                      Save
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setEditing(false)}
                    style={{
                      borderRadius: radius.lg - 4,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                    }}
                  >
                    <Text
                      style={{ color: palette.mutedForeground, fontSize: 13 }}
                    >
                      Cancel
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable onPress={() => setEditing(true)}>
                <Text
                  style={{
                    marginTop: 4,
                    fontSize: 14,
                    color: userEvent.reflection
                      ? palette.mutedForeground
                      : palette.primary,
                    fontStyle: userEvent.reflection ? "italic" : "normal",
                  }}
                >
                  {userEvent.reflection ?? "+ Add a reflection"}
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </View>

      <View
        style={{
          borderRadius: radius.full,
          backgroundColor: badgeBg,
          paddingHorizontal: 10,
          paddingVertical: 2,
        }}
      >
        <Text style={{ fontSize: 12, fontWeight: "500", color: badgeText }}>
          {isAttended ? "Attended" : "Saved"}
        </Text>
      </View>
    </View>
  );
}

function StatCard({
  label,
  value,
  palette,
}: {
  label: string;
  value: number;
  palette: Palette;
}) {
  return (
    <View
      style={{
        width: "47%",
        flexGrow: 1,
        alignItems: "center",
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: palette.border,
        backgroundColor: palette.card,
        padding: 16,
        ...shadowCard,
      }}
    >
      <Text style={{ fontSize: 30, fontWeight: "700", color: palette.primary }}>
        {value}
      </Text>
      <Text
        style={{
          fontSize: 13,
          color: palette.mutedForeground,
          textAlign: "center",
        }}
      >
        {label}
      </Text>
    </View>
  );
}
