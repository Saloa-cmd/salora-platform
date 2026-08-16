import AsyncStorage from "@react-native-async-storage/async-storage";
import { Appearance, Pressable, StyleSheet, View } from "react-native";
import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import type { ResolvedTheme, ThemePreference } from "@salora/ui";
import { resolveTheme } from "@salora/ui";
import { mobileThemes } from "./theme";
import { SaloraIcon } from "@/components/SaloraIcon";
import { Text } from "@/components/Text";

const STORAGE_KEY = "salora.theme.v1";
const preferences: ThemePreference[] = ["dark", "light", "system"];
type ThemeContextValue = { preference: ThemePreference; resolved: ResolvedTheme; colors: typeof mobileThemes.dark | typeof mobileThemes.light; setPreference: (value: ThemePreference) => void };
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function SaloraThemeProvider({ children }: PropsWithChildren) {
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(Appearance.getColorScheme() === "light" ? "light" : "dark");
  useEffect(() => { void AsyncStorage.getItem(STORAGE_KEY).then((value) => { if (value && preferences.includes(value as ThemePreference)) setPreferenceState(value as ThemePreference); }); const subscription = Appearance.addChangeListener(({ colorScheme }) => setSystemTheme(colorScheme === "light" ? "light" : "dark")); return () => subscription.remove(); }, []);
  const setPreference = (value: ThemePreference) => { setPreferenceState(value); void AsyncStorage.setItem(STORAGE_KEY, value); };
  const resolved = resolveTheme(preference, systemTheme);
  const value = useMemo(() => ({ preference, resolved, colors: mobileThemes[resolved], setPreference }), [preference, resolved]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useSaloraTheme() { const value = useContext(ThemeContext); if (!value) throw new Error("useSaloraTheme must be used within SaloraThemeProvider"); return value; }

export function MobileThemeControl({ showLabel = false }: { showLabel?: boolean }) {
  const { preference, colors, setPreference } = useSaloraTheme();
  const next = preferences[(preferences.indexOf(preference) + 1) % preferences.length] ?? "system";
  const labels = { dark: "داكن", light: "فاتح", system: "الجهاز" } as const;
  return <Pressable accessibilityRole="button" accessibilityLabel={`المظهر ${labels[preference]}. تغيير إلى ${labels[next]}`} onPress={() => setPreference(next)} style={[styles.control, { borderColor: colors.border, backgroundColor: colors.surface }]}><SaloraIcon name="theme" color={colors.foreground} decorative /><View>{showLabel ? <Text style={{ color: colors.foreground }}>{labels[preference]}</Text> : null}</View></Pressable>;
}
const styles = StyleSheet.create({ control: { minWidth: 44, minHeight: 44, borderWidth: 1, borderRadius: 12, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, paddingHorizontal: 10 } });
