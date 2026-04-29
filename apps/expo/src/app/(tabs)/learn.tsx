import { Pressable, ScrollView, Text, useColorScheme, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TOPICS = [
  {
    emoji: "🎻",
    title: "Orchestral Music",
    subtitle: "Symphonies, concertos & the orchestra",
    bgLight: "#EFF6FF",
    bgDark: "rgba(29,78,216,0.15)",
  },
  {
    emoji: "🎭",
    title: "Opera",
    subtitle: "Stories told through song",
    bgLight: "#FDF4FF",
    bgDark: "rgba(162,28,175,0.15)",
  },
  {
    emoji: "🎹",
    title: "Solo Recital",
    subtitle: "Piano, violin & voice up close",
    bgLight: "#FFFBEB",
    bgDark: "rgba(180,83,9,0.15)",
  },
  {
    emoji: "🎵",
    title: "Chamber Music",
    subtitle: "Intimate small-group works",
    bgLight: "#F0FDF4",
    bgDark: "rgba(21,128,61,0.15)",
  },
  {
    emoji: "🕰️",
    title: "Music History",
    subtitle: "Baroque to contemporary",
    bgLight: "#FFF7ED",
    bgDark: "rgba(194,65,12,0.15)",
  },
  {
    emoji: "🎷",
    title: "Jazz",
    subtitle: "Improvisation & American roots",
    bgLight: "#F5F3FF",
    bgDark: "rgba(109,40,217,0.15)",
  },
];

export default function LearnScreen() {
  const isDark = useColorScheme() === "dark";
  const bg = isDark ? "#111111" : "#FFFAEF";
  const cardBg = isDark ? "#1A1A1A" : "#FFFFFF";
  const border = isDark ? "#2D2D2D" : "#E5E7EB";
  const textPrimary = isDark ? "#F9FAFB" : "#111827";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 }}>
          <Text style={{ fontSize: 24, fontWeight: "700", color: textPrimary }}>Learn</Text>
          <Text style={{ fontSize: 14, color: "#6B7280", marginTop: 4 }}>
            Classical & jazz, explained simply
          </Text>
        </View>

        {/* Topics */}
        <View style={{ paddingHorizontal: 16 }}>
          {TOPICS.map((topic) => (
            <Pressable
              key={topic.title}
              style={{ marginBottom: 12, opacity: 1 }}
              onPress={() => {/* coming soon */}}
            >
              <View style={{
                flexDirection: "row", alignItems: "center", gap: 16,
                borderRadius: 16, borderWidth: 1, borderColor: border,
                backgroundColor: cardBg, padding: 16,
              }}>
                <View style={{
                  width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                  alignItems: "center", justifyContent: "center",
                  backgroundColor: isDark ? topic.bgDark : topic.bgLight,
                }}>
                  <Text style={{ fontSize: 22 }}>{topic.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: textPrimary }}>
                    {topic.title}
                  </Text>
                  <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                    {topic.subtitle}
                  </Text>
                </View>
                <Text style={{ color: "#9CA3AF", fontSize: 18 }}>›</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Coming soon banner */}
        <View style={{
          marginHorizontal: 16, marginTop: 8, borderRadius: 16,
          borderWidth: 1, borderColor: isDark ? "rgba(120,53,15,0.4)" : "#FDE68A",
          backgroundColor: isDark ? "rgba(120,53,15,0.15)" : "#FFFBEB",
          padding: 16,
        }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: isDark ? "#FCD34D" : "#92400E" }}>
            More coming soon
          </Text>
          <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 4, lineHeight: 18 }}>
            Deep dives, composer profiles, and listening guides are on the way.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
