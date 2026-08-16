import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SaloraThemeProvider, useSaloraTheme } from "@/lib/ThemeProvider";

function ThemedNavigation() {
  const { colors, resolved } = useSaloraTheme();
  return (
    <>
      <StatusBar style={resolved === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.cream,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background }
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="product/[id]" options={{ title: "Product" }} />
        <Stack.Screen name="checkout" options={{ title: "Checkout" }} />
        <Stack.Screen name="confirmation" options={{ title: "Order Tracking" }} />
        <Stack.Screen name="loyalty" options={{ title: "Loyalty Preview" }} />
        <Stack.Screen name="executive" options={{ title: "Executive Mode" }} />
      </Stack>
    </>
  );
}

export default function RootLayout() { return <SaloraThemeProvider><ThemedNavigation /></SaloraThemeProvider>; }
