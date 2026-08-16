import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useSaloraTheme } from "@/lib/ThemeProvider";

export default function TabsLayout() {
  const { colors } = useSaloraTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 82,
          paddingTop: 8
        },
        tabBarActiveTintColor: colors.goldSoft,
        tabBarInactiveTintColor: colors.muted
      }}
    >
      <Tabs.Screen name="home" options={{ title: "Home", tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="menu" options={{ title: "Menu", tabBarIcon: ({ color, size }) => <Ionicons name="cafe-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="cart" options={{ title: "Cart", tabBarIcon: ({ color, size }) => <Ionicons name="bag-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="concierge" options={{ title: "AI", tabBarIcon: ({ color, size }) => <Ionicons name="sparkles-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="offers" options={{ href: null }} />
    </Tabs>
  );
}
