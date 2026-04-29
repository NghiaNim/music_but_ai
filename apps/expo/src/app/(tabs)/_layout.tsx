import { useColorScheme } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

function tabIcon(focused: boolean, filled: IoniconsName, outline: IoniconsName) {
  return ({ color, size }: { color: string; size: number }) => (
    <Ionicons name={focused ? filled : outline} size={size} color={color} />
  );
}

export default function TabLayout() {
  const isDark = useColorScheme() === "dark";

  const tabBarStyle = {
    backgroundColor: isDark ? "#111" : "#FFFFFF",
    borderTopColor: isDark ? "#222" : "#F0F0F0",
    height: 88,
    paddingBottom: 28,
    paddingTop: 8,
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#9C1738",
        tabBarInactiveTintColor: isDark ? "#777" : "#999",
        tabBarStyle,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size, focused }) =>
            tabIcon(focused, "home", "home-outline")({ color, size }),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: "Events",
          tabBarIcon: ({ color, size, focused }) =>
            tabIcon(focused, "calendar", "calendar-outline")({ color, size }),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "AI Mentor",
          tabBarIcon: ({ color, size, focused }) =>
            tabIcon(
              focused,
              "chatbubbles",
              "chatbubbles-outline",
            )({ color, size }),
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: "Learn",
          tabBarIcon: ({ color, size, focused }) =>
            tabIcon(focused, "book", "book-outline")({ color, size }),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size, focused }) =>
            tabIcon(focused, "person", "person-outline")({ color, size }),
        }}
      />
    </Tabs>
  );
}
