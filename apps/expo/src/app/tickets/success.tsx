import { useEffect, useRef } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { radius, shadowCard, usePalette } from "~/theme";
import { trpc } from "~/utils/api";

function formatLongDateOnly(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function TicketSuccessScreen() {
  const router = useRouter();
  const { palette } = usePalette();
  const params = useLocalSearchParams<{ orderId?: string }>();
  const orderId = typeof params.orderId === "string" ? params.orderId : "";
  const queryClient = useQueryClient();
  const autoConfirmAttempted = useRef(false);

  const confirm = useMutation(
    trpc.ticket.confirmOrder.mutationOptions({
      onSuccess: (data) => {
        if (data.status === "completed") {
          void queryClient.invalidateQueries(trpc.ticket.pathFilter());
        }
      },
    }),
  );

  const { data: order } = useQuery({
    ...trpc.ticket.orderById.queryOptions({ orderId }),
    enabled: !!orderId,
  });

  const confirmMutate = confirm.mutate;
  useEffect(() => {
    if (!orderId || autoConfirmAttempted.current) return;
    if (order?.status !== "pending") return;

    autoConfirmAttempted.current = true;

    const tryConfirm = (attempt: number) => {
      if (attempt > 3) return;
      const delay = attempt === 0 ? 500 : 2000;
      setTimeout(() => {
        confirmMutate(
          { orderId },
          {
            onSuccess: (data) => {
              if (data.status !== "completed" && attempt < 3) {
                tryConfirm(attempt + 1);
              }
            },
            onError: () => {
              if (attempt < 3) tryConfirm(attempt + 1);
            },
          },
        );
      }, delay);
    };

    tryConfirm(0);
  }, [orderId, order?.status, confirmMutate]);

  const orderData = confirm.data ?? order;
  const isCompleted = orderData?.status === "completed";
  const hasFailed = confirm.isError;

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={{ flex: 1, backgroundColor: palette.background }}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 16,
          paddingTop: 48,
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: palette.emeraldSoft,
            marginBottom: 16,
          }}
        >
          <Ionicons
            name={isCompleted ? "checkmark-circle-outline" : "time-outline"}
            size={40}
            color={isCompleted ? palette.emerald : palette.amberStrong}
          />
        </View>

        <Text
          style={{
            fontSize: 24,
            fontWeight: "700",
            color: palette.foreground,
            marginBottom: 8,
            textAlign: "center",
          }}
        >
          {isCompleted
            ? "Tickets Confirmed!"
            : hasFailed
              ? "Confirmation Issue"
              : "Confirming Your Order..."}
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: palette.mutedForeground,
            marginBottom: 24,
            textAlign: "center",
          }}
        >
          {isCompleted
            ? "You're all set for an amazing experience"
            : hasFailed
              ? "We couldn't verify the payment — it may still be processing"
              : "We're verifying your payment with Stripe"}
        </Text>

        {!isCompleted && !!orderId && (
          <Pressable
            onPress={() => confirm.mutate({ orderId })}
            disabled={confirm.isPending}
            style={{
              borderRadius: radius.lg,
              backgroundColor: palette.emerald,
              paddingHorizontal: 16,
              paddingVertical: 10,
              marginBottom: 24,
              opacity: confirm.isPending ? 0.6 : 1,
            }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "600" }}>
              {confirm.isPending ? "Confirming..." : "Retry Confirmation"}
            </Text>
          </Pressable>
        )}

        {orderData?.event && (
          <View
            style={{
              width: "100%",
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: palette.border,
              backgroundColor: palette.card,
              padding: 20,
              ...shadowCard,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: palette.emeraldSoft,
                }}
              >
                <Ionicons
                  name="ticket-outline"
                  size={18}
                  color={palette.emerald}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "500",
                    color: palette.emerald,
                  }}
                >
                  {orderData.quantity ?? 0}× Ticket
                  {(orderData.quantity ?? 0) > 1 ? "s" : ""}
                </Text>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "600",
                    color: palette.foreground,
                  }}
                >
                  {orderData.event.title}
                </Text>
              </View>
            </View>

            <View style={{ gap: 8 }}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Ionicons
                  name="calendar-outline"
                  size={14}
                  color={palette.mutedForeground}
                />
                <Text style={{ fontSize: 14, color: palette.mutedForeground }}>
                  {formatLongDateOnly(new Date(orderData.event.date))}
                </Text>
              </View>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Ionicons
                  name="location-outline"
                  size={14}
                  color={palette.mutedForeground}
                />
                <Text style={{ fontSize: 14, color: palette.mutedForeground }}>
                  {orderData.event.venue}
                </Text>
              </View>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Ionicons
                  name="cash-outline"
                  size={14}
                  color={palette.mutedForeground}
                />
                <Text style={{ fontSize: 14, color: palette.mutedForeground }}>
                  Total paid: ${((orderData.totalCents ?? 0) / 100).toFixed(2)}
                </Text>
              </View>
            </View>

            {isCompleted && orderData.id && (
              <View
                style={{
                  marginTop: 16,
                  borderRadius: radius.lg - 2,
                  backgroundColor: palette.emeraldSoft,
                  padding: 12,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "500",
                    color: palette.emeraldForeground,
                  }}
                >
                  Order #{orderData.id.slice(0, 8).toUpperCase()}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: palette.emeraldForeground,
                    opacity: 0.7,
                  }}
                >
                  A confirmation will be sent to your email
                </Text>
              </View>
            )}
          </View>
        )}

        <View
          style={{
            flexDirection: "row",
            gap: 12,
            width: "100%",
            marginTop: 24,
          }}
        >
          <Pressable
            onPress={() => router.replace("/(tabs)/events")}
            style={{
              flex: 1,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: palette.border,
              backgroundColor: palette.card,
              paddingVertical: 12,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: palette.foreground,
              }}
            >
              Browse Events
            </Text>
          </Pressable>
          {orderData?.event && (
            <Pressable
              onPress={() =>
                router.replace(
                  `/(tabs)/chat?eventId=${orderData.eventId}&mode=learning`,
                )
              }
              style={{
                flex: 1,
                borderRadius: radius.lg,
                backgroundColor: palette.primary,
                paddingVertical: 12,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: palette.primaryForeground,
                }}
              >
                Prepare for the Show
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
