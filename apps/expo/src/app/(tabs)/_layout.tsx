import { useColorScheme } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

// Active state: filled variant. Inactive: outline variant.
// These map as closely as possible to the Next.js SVG icon shapes.
const ICONS: Record<
  string,
  { filled: IoniconsName; outline: IoniconsName }
> = {
  home:       { filled: "home",              outline: "home-outline" },
  learn:      { filled: "book",              outline: "book-outline" },
  events:     { filled: "calendar-clear",    outline: "calendar-clear-outline" },
  postEvent:  { filled: "add-circle",        outline: "add-circle-outline" },
  profile:    { filled: "person-circle",     outline: "person-circle-outline" },
};

function TabIcon(
  name: keyof typeof ICONS,
  focused: boolean,
  color: string,
  size: number,
) {
  const { filled, outline } = ICONS[name]!;
  return <Ionicons name={focused ? filled : outline} size={size} color={color} />;
}

export default function TabLayout() {
  const isDark = useColorScheme() === "dark";

  const tabBarStyle = {
    backgroundColor: isDark ? "#1C0A00" : "#FFFBEB",
    borderTopColor: isDark ? "#2D1200" : "#FDE68A",
    borderTopWidth: 1,
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
            TabIcon("home", focused, color, size),
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: "Learn",
          tabBarIcon: ({ color, size, focused }) =>
            TabIcon("learn", focused, color, size),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: "Events",
          tabBarIcon: ({ color, size, focused }) =>
            TabIcon("events", focused, color, size),
        }}
      />
      <Tabs.Screen
        name="post-event"
        options={{
          title: "Post Event",
          tabBarIcon: ({ color, size, focused }) =>
            TabIcon("postEvent", focused, color, size),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size, focused }) =>
            TabIcon("profile", focused, color, size),
        }}
      />
      {/* chat is a valid route but hidden from the tab bar */}
      <Tabs.Screen
        name="chat"
        options={{ href: null }}
      />
    </Tabs>
  );
}
