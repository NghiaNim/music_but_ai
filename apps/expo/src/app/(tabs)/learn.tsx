import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TOPICS = [
  {
    emoji: "🎻",
    title: "Orchestral Music",
    subtitle: "Symphonies, concertos & the orchestra",
    color: "#EFF6FF",
    darkColor: "rgba(29,78,216,0.15)",
  },
  {
    emoji: "🎭",
    title: "Opera",
    subtitle: "Stories told through song",
    color: "#FDF4FF",
    darkColor: "rgba(162,28,175,0.15)",
  },
  {
    emoji: "🎹",
    title: "Solo Recital",
    subtitle: "Piano, violin & voice up close",
    color: "#FFFBEB",
    darkColor: "rgba(180,83,9,0.15)",
  },
  {
    emoji: "🎵",
    title: "Chamber Music",
    subtitle: "Intimate small-group works",
    color: "#F0FDF4",
    darkColor: "rgba(21,128,61,0.15)",
  },
  {
    emoji: "🕰️",
    title: "Music History",
    subtitle: "Baroque to contemporary",
    color: "#FFF7ED",
    darkColor: "rgba(194,65,12,0.15)",
  },
  {
    emoji: "🎷",
    title: "Jazz",
    subtitle: "Improvisation & American roots",
    color: "#F5F3FF",
    darkColor: "rgba(109,40,217,0.15)",
  },
];

export default function LearnScreen() {
  return (
    <SafeAreaView className="bg-background flex-1">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4 pt-3 pb-4">
          <Text className="text-foreground text-2xl font-bold">Learn</Text>
          <Text className="text-muted-foreground mt-1 text-sm">
            Classical & jazz, explained simply
          </Text>
        </View>

        <View className="px-4">
          {TOPICS.map((topic) => (
            <Pressable
              key={topic.title}
              className="mb-3 active:opacity-70"
              onPress={() => {
                /* coming soon */
              }}
            >
              <View className="bg-card flex-row items-center gap-4 rounded-2xl border p-4">
                <View
                  className="h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: topic.color }}
                >
                  <Text style={{ fontSize: 22 }}>{topic.emoji}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-foreground text-sm font-semibold">
                    {topic.title}
                  </Text>
                  <Text className="text-muted-foreground mt-0.5 text-xs">
                    {topic.subtitle}
                  </Text>
                </View>
                <Text className="text-muted-foreground text-lg">›</Text>
              </View>
            </Pressable>
          ))}
        </View>

        <View className="mx-4 mt-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
          <Text className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            More coming soon
          </Text>
          <Text className="text-muted-foreground mt-1 text-xs leading-relaxed">
            Deep dives, composer profiles, and listening guides are on the way.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
