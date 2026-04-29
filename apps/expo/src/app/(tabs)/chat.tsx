import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function ChatScreen() {
  return (
    <SafeAreaView className="bg-background flex-1">
      <View className="px-4 pt-3 pb-2">
        <Text className="text-foreground text-2xl font-bold">AI Mentor</Text>
      </View>

      <View className="flex-1 items-center justify-center px-8">
        <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-950/30">
          <Ionicons name="chatbubbles" size={36} color="#7C3AED" />
        </View>
        <Text className="text-foreground text-center text-xl font-bold">
          Tanny is coming soon
        </Text>
        <Text className="text-muted-foreground mt-2 text-center text-sm leading-relaxed">
          Your AI musical sidekick — concert recs, music history, trivia, and
          more.
        </Text>
      </View>
    </SafeAreaView>
  );
}
