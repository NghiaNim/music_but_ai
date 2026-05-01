import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "@tanstack/react-query";

import { trpc } from "~/utils/api";
import { authClient } from "~/utils/auth";
import { pushSignIn, toSignInHref } from "~/utils/auth-redirect";

const BUY_TICKET_REGEX = /\[BUY_TICKET:([a-f0-9-]+)\]/g;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const DISCOVERY_SUGGESTIONS = [
  "I've never been to a classical or jazz concert. What's good for a beginner?",
  "I'm looking for something fun to do this weekend",
  "What opera would you recommend for a first-timer?",
  "I love dramatic, powerful music. What should I see?",
];

export default function ChatScreen() {
  const isDark = useColorScheme() === "dark";
  const bg = isDark ? "#111111" : "#FFFAEF";
  const textPrimary = isDark ? "#F9FAFB" : "#111827";
  const border = isDark ? "#2D2D2D" : "#E5E7EB";
  const cardBg = isDark ? "#1A1A1A" : "#FFFFFF";
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const { data: session } = authClient.useSession();
  const params = useLocalSearchParams<{
    mode?: "discovery" | "learning";
    eventId?: string;
    liveEventId?: string;
    q?: string;
  }>();

  const eventId = params.eventId;
  const liveEventId = params.liveEventId;
  const [mode, setMode] = useState<"discovery" | "learning">(
    params.mode === "learning" ? "learning" : "discovery",
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState(params.q ?? "");
  const [sessionId, setSessionId] = useState<string | undefined>();

  const { data: contextEvent } = useQuery({
    ...trpc.event.byId.queryOptions({ id: eventId ?? "" }),
    enabled: !!eventId,
  });
  const { data: contextLiveEvent } = useQuery({
    ...trpc.liveEvent.byId.queryOptions({ id: liveEventId ?? "" }),
    enabled: !!liveEventId,
  });

  const activeEvent = useMemo(() => {
    if (contextEvent) {
      return {
        id: contextEvent.id,
        title: contextEvent.title,
        date: contextEvent.date,
        venue: contextEvent.venue,
      };
    }
    if (contextLiveEvent) {
      return {
        id: contextLiveEvent.id,
        title: contextLiveEvent.title,
        date: contextLiveEvent.date ?? contextLiveEvent.dateText ?? "",
        venue: contextLiveEvent.venueName ?? contextLiveEvent.location ?? "",
      };
    }
    return undefined;
  }, [contextEvent, contextLiveEvent]);

  const sendMessage = useMutation(
    trpc.chat.send.mutationOptions({
      onSuccess: (data) => {
        if (data.sessionId) setSessionId(data.sessionId);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.response },
        ]);
      },
      onError: (err) => {
        setMessages((prev) => prev.slice(0, -1));
        Alert.alert(
          "Ton Ton couldn't respond",
          err.message || "Please try again.",
        );
      },
    }),
  );

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages, sendMessage.isPending]);

  const canSend = inputValue.trim().length > 0 && !sendMessage.isPending;
  const learningSuggestions = activeEvent?.title
    ? [
        `What should I listen for during "${activeEvent.title}"?`,
        "Tell me about the composer(s) on this program",
        "What's the dress code and etiquette for this concert?",
        "Why is this program special?",
      ]
    : [
        "What should I listen for during the performance?",
        "Tell me about the composer",
        "What's the dress code? Any etiquette tips?",
        "Why is this piece considered a masterwork?",
      ];
  const suggestions =
    mode === "discovery" ? DISCOVERY_SUGGESTIONS : learningSuggestions;

  const handleSend = () => {
    const content = inputValue.trim();
    if (!content || sendMessage.isPending) return;

    const previousMessages = messages;
    setMessages((prev) => [...prev, { role: "user", content }]);
    setInputValue("");

    sendMessage.mutate({
      sessionId,
      eventId,
      liveEventId,
      mode,
      content,
      history: previousMessages,
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 8,
            borderBottomWidth: 1,
            borderBottomColor: border,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isDark ? "rgba(120,53,15,0.3)" : "#FEF3C7",
              }}
            >
              <Ionicons
                name="musical-notes-outline"
                size={20}
                color="#D97706"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontSize: 17, fontWeight: "700", color: textPrimary }}
              >
                Ask Ton Ton
              </Text>
              <Text
                style={{ fontSize: 12, color: "#6B7280" }}
                numberOfLines={1}
              >
                {mode === "discovery"
                  ? "Help me find a concert"
                  : activeEvent
                    ? `About: ${activeEvent.title}`
                    : "Help me understand this event"}
              </Text>
            </View>
            <Pressable
              onPress={() =>
                session?.user
                  ? router.push("/tickets")
                  : router.push(toSignInHref("/tickets"))
              }
              style={{
                borderRadius: 8,
                borderWidth: 1,
                borderColor: border,
                paddingHorizontal: 9,
                paddingVertical: 6,
              }}
            >
              <Text
                style={{ color: textPrimary, fontSize: 11, fontWeight: "600" }}
              >
                Tickets
              </Text>
            </Pressable>
          </View>
          {!eventId && !liveEventId ? (
            <View
              style={{
                flexDirection: "row",
                marginTop: 10,
                gap: 8,
              }}
            >
              <ModeButton
                active={mode === "discovery"}
                label="Discover"
                onPress={() => setMode("discovery")}
              />
              <ModeButton
                active={mode === "learning"}
                label="Learn"
                onPress={() => setMode("learning")}
              />
            </View>
          ) : null}
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 14,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable
            onPress={() => router.back()}
            style={{
              marginBottom: 12,
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Ionicons name="chevron-back" size={16} color="#9C1738" />
            <Text style={{ color: "#9C1738", fontSize: 13, fontWeight: "500" }}>
              Back
            </Text>
          </Pressable>

          {activeEvent ? (
            <View
              style={{
                marginBottom: 14,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: isDark ? "#78350F" : "#FDE68A",
                backgroundColor: isDark ? "rgba(120,53,15,0.2)" : "#FFFBEB",
                padding: 12,
              }}
            >
              <Text
                style={{ fontSize: 11, fontWeight: "700", color: "#B45309" }}
              >
                Talking about
              </Text>
              <Text
                style={{
                  marginTop: 2,
                  fontSize: 14,
                  fontWeight: "600",
                  color: textPrimary,
                }}
              >
                {activeEvent.title}
              </Text>
              <Text style={{ marginTop: 2, fontSize: 12, color: "#6B7280" }}>
                {formatFriendlyDate(activeEvent.date)}{" "}
                {activeEvent.venue ? `· ${activeEvent.venue}` : ""}
              </Text>
            </View>
          ) : null}

          {messages.length === 0 ? (
            <View style={{ gap: 12, marginBottom: 12 }}>
              <View
                style={{
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: border,
                  backgroundColor: cardBg,
                  padding: 14,
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    color: textPrimary,
                  }}
                >
                  {mode === "discovery"
                    ? "What are you in the mood for?"
                    : activeEvent
                      ? `Ask me about "${activeEvent.title}"`
                      : "What would you like to learn?"}
                </Text>
                <Text
                  style={{
                    marginTop: 6,
                    fontSize: 13,
                    lineHeight: 20,
                    color: "#6B7280",
                  }}
                >
                  {mode === "discovery"
                    ? "I can help you find the perfect concert based on your interests."
                    : "Ask me anything about the event, the music, or the composers."}
                </Text>
              </View>
              {suggestions.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setInputValue(item)}
                  style={{
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: border,
                    backgroundColor: cardBg,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                  }}
                >
                  <Text style={{ fontSize: 13, color: textPrimary }}>
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          <View style={{ gap: 12 }}>
            {messages.map((message, index) => (
              <ChatBubble
                key={`${message.role}-${index}`}
                message={message}
                isDark={isDark}
              />
            ))}
            {sendMessage.isPending ? <TypingIndicator isDark={isDark} /> : null}
          </View>
        </ScrollView>

        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: border,
            backgroundColor: isDark ? "#1A1A1A" : "#FFFBEB",
            paddingHorizontal: 12,
            paddingTop: 10,
            paddingBottom: 10,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              gap: 8,
              borderWidth: 1,
              borderColor: border,
              borderRadius: 14,
              backgroundColor: cardBg,
              padding: 8,
            }}
          >
            <TextInput
              value={inputValue}
              onChangeText={setInputValue}
              style={{
                flex: 1,
                minHeight: 38,
                maxHeight: 130,
                color: textPrimary,
                paddingHorizontal: 8,
                paddingTop: 8,
                paddingBottom: 8,
              }}
              editable={!sendMessage.isPending}
              multiline
              placeholder={
                mode === "discovery"
                  ? "What kind of concert are you looking for?"
                  : "What would you like to know about this event?"
              }
              placeholderTextColor="#9CA3AF"
            />
            <Pressable
              onPress={handleSend}
              disabled={!canSend}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: canSend ? "#9C1738" : "#A1A1AA",
              }}
            >
              <Ionicons name="send" size={15} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ModeButton({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        borderRadius: 8,
        borderWidth: 1,
        borderColor: active ? "#9C1738" : "#D4D4D8",
        backgroundColor: active ? "#9C1738" : "#FFFFFF",
        paddingHorizontal: 12,
        paddingVertical: 6,
      }}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: "600",
          color: active ? "#FFFFFF" : "#52525B",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function TypingIndicator({ isDark }: { isDark: boolean }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: isDark ? "rgba(161,98,7,0.3)" : "#FEF3C7",
        }}
      >
        <Ionicons name="musical-note-outline" size={14} color="#D97706" />
      </View>
      <View
        style={{
          borderRadius: 14,
          borderTopLeftRadius: 4,
          borderWidth: 1,
          borderColor: isDark ? "#2D2D2D" : "#E5E7EB",
          backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF",
          paddingHorizontal: 12,
          paddingVertical: 10,
        }}
      >
        <Text style={{ fontSize: 12, color: "#6B7280" }}>
          Ton Ton is typing...
        </Text>
      </View>
    </View>
  );
}

function ChatBubble({
  message,
  isDark,
}: {
  message: ChatMessage;
  isDark: boolean;
}) {
  const isUser = message.role === "user";
  const textPrimary = isDark ? "#F9FAFB" : "#111827";
  const buyMatch = /\[BUY_TICKET:([a-f0-9-]+)\]/.exec(message.content);
  const buyEventId = buyMatch?.[1];
  const textContent = message.content.replace(BUY_TICKET_REGEX, "").trim();

  const checkout = useMutation(
    trpc.ticket.createCheckoutSession.mutationOptions({
      onSuccess: (data) => {
        if (data.checkoutUrl) {
          void Linking.openURL(data.checkoutUrl);
        }
      },
      onError: (err) => {
        if (err.data?.code === "UNAUTHORIZED") {
          Alert.alert(
            "Sign in required",
            "Please sign in to purchase tickets.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Sign in",
                onPress: () => pushSignIn("/(tabs)/chat"),
              },
            ],
          );
          return;
        }
        Alert.alert(
          "Checkout failed",
          err.message || "Could not open checkout.",
        );
      },
    }),
  );

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: isUser ? "flex-end" : "flex-start",
      }}
    >
      <View style={{ maxWidth: "82%", gap: 8 }}>
        <View
          style={{
            borderRadius: 16,
            borderTopLeftRadius: isUser ? 16 : 4,
            borderTopRightRadius: isUser ? 4 : 16,
            borderWidth: isUser ? 0 : 1,
            borderColor: isDark ? "#2D2D2D" : "#E5E7EB",
            backgroundColor: isUser
              ? "#9C1738"
              : isDark
                ? "#1A1A1A"
                : "#FFFFFF",
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        >
          <Text
            style={{
              color: isUser ? "#FFFFFF" : textPrimary,
              fontSize: 14,
              lineHeight: 20,
            }}
          >
            {textContent}
          </Text>
        </View>
        {buyEventId && !isUser ? (
          <Pressable
            disabled={checkout.isPending}
            onPress={() =>
              checkout.mutate({ eventId: buyEventId, quantity: 1 })
            }
            style={{
              borderRadius: 12,
              borderWidth: 1,
              borderColor: isDark ? "#14532D" : "#A7F3D0",
              backgroundColor: isDark ? "rgba(6,95,70,0.25)" : "#ECFDF5",
              paddingHorizontal: 12,
              paddingVertical: 10,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: "600", color: "#047857" }}>
              {checkout.isPending ? "Opening checkout..." : "Buy Tickets Now"}
            </Text>
            <Text style={{ fontSize: 11, color: "#059669", marginTop: 2 }}>
              Exclusive discounted price through us
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function formatFriendlyDate(value: Date | string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
