import { useEffect } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { trpc } from "~/utils/api";
import { authClient } from "~/utils/auth";
import { toSignInHref } from "~/utils/auth-redirect";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  completed: { bg: "#D1FAE5", text: "#047857" },
  pending: { bg: "#FEF3C7", text: "#B45309" },
  failed: { bg: "#FEE2E2", text: "#B91C1C" },
  refunded: { bg: "#E2E8F0", text: "#334155" },
};

function formatMonthDay(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function TicketsScreen() {
  const router = useRouter();
  const isDark = useColorScheme() === "dark";
  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (!session?.user) {
      router.replace(toSignInHref("/tickets"));
    }
  }, [router, session?.user]);

  const {
    data: orders,
    isPending,
    error,
  } = useQuery({
    ...trpc.ticket.myOrders.queryOptions(),
    enabled: !!session?.user,
  });

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: isDark ? "#111111" : "#FFFAEF" }}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
      >
        {isPending ? (
          <View style={{ gap: 12 }}>
            {Array.from({ length: 3 }).map((_, index) => (
              <View
                key={index}
                style={{
                  height: 88,
                  borderRadius: 14,
                  backgroundColor: isDark ? "#202020" : "#EFEFEF",
                }}
              />
            ))}
          </View>
        ) : error ? (
          <View
            style={{
              borderRadius: 14,
              backgroundColor: "#FEF2F2",
              padding: 14,
            }}
          >
            <Text style={{ color: "#B91C1C", fontSize: 13, fontWeight: "600" }}>
              Could not load tickets right now.
            </Text>
          </View>
        ) : !orders.length ? (
          <View
            style={{
              borderRadius: 16,
              borderWidth: 1,
              borderColor: isDark ? "#2D2D2D" : "#E5E7EB",
              backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF",
              padding: 18,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 30 }}>🎫</Text>
            <Text
              style={{
                marginTop: 8,
                fontSize: 18,
                fontWeight: "700",
                color: isDark ? "#F9FAFB" : "#111827",
              }}
            >
              No tickets yet
            </Text>
            <Text
              style={{
                marginTop: 4,
                color: "#6B7280",
                fontSize: 13,
                textAlign: "center",
              }}
            >
              Browse events or ask Ton Ton for a recommendation.
            </Text>
            <Pressable
              onPress={() => router.push("/(tabs)/events")}
              style={{
                marginTop: 12,
                borderRadius: 10,
                backgroundColor: "#9C1738",
                paddingHorizontal: 14,
                paddingVertical: 10,
              }}
            >
              <Text
                style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "600" }}
              >
                Browse events
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {orders.map((order) => {
              const statusColors = STATUS_COLORS[order.status] ?? {
                bg: "#FEF3C7",
                text: "#B45309",
              };
              return (
                <Pressable
                  key={order.id}
                  onPress={() => router.push(`/event/${order.eventId}`)}
                  style={{
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: isDark ? "#2D2D2D" : "#E5E7EB",
                    backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF",
                    padding: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: isDark
                        ? "rgba(16,185,129,0.2)"
                        : "#D1FAE5",
                    }}
                  >
                    <Text style={{ fontSize: 16 }}>🎟️</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      numberOfLines={1}
                      style={{
                        color: isDark ? "#F9FAFB" : "#111827",
                        fontSize: 14,
                        fontWeight: "600",
                      }}
                    >
                      {order.event.title}
                    </Text>
                    <Text
                      style={{ color: "#6B7280", fontSize: 12, marginTop: 2 }}
                    >
                      {formatMonthDay(new Date(order.event.date))} ·{" "}
                      {order.quantity}x ${(order.totalCents / 100).toFixed(2)}
                    </Text>
                  </View>
                  <View
                    style={{
                      borderRadius: 999,
                      backgroundColor: statusColors.bg,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                    }}
                  >
                    <Text
                      style={{
                        color: statusColors.text,
                        fontSize: 10,
                        fontWeight: "700",
                      }}
                    >
                      {order.status}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
