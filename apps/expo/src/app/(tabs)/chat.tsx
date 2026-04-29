import { Text, useColorScheme, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function ChatScreen() {
  const isDark = useColorScheme() === "dark";
  const bg = isDark ? "#111111" : "#FFFAEF";
  const textPrimary = isDark ? "#F9FAFB" : "#111827";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 24, fontWeight: "700", color: textPrimary }}>AI Mentor</Text>
      </View>

      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
        <View style={{
          width: 80, height: 80, borderRadius: 40, marginBottom: 16,
          alignItems: "center", justifyContent: "center",
          backgroundColor: isDark ? "rgba(76,29,149,0.3)" : "#EDE9FE",
        }}>
          <Ionicons name="chatbubbles" size={36} color="#7C3AED" />
        </View>
        <Text style={{ fontSize: 20, fontWeight: "700", color: textPrimary, textAlign: "center" }}>
          Ton Ton is coming soon
        </Text>
        <Text style={{ fontSize: 14, color: "#6B7280", marginTop: 8, textAlign: "center", lineHeight: 22 }}>
          Your AI musical sidekick — concert recs, music history, trivia, and more.
        </Text>
      </View>
    </SafeAreaView>
  );
}
