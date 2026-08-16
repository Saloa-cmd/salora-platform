import { Link } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { colors, radii, spacing } from "@/lib/theme";
import { MobileThemeControl, useSaloraTheme } from "@/lib/ThemeProvider";

export default function ProfileScreen() {
  const { colors: activeColors } = useSaloraTheme();
  return (
    <Screen>
      <Text variant="eyebrow">Profile</Text>
      <Text variant="title" style={styles.title}>Guest profile</Text>
      <View style={[styles.appearance, { backgroundColor: activeColors.surface, borderColor: activeColors.border }]}><View><Text variant="subtitle" style={{ color: activeColors.foreground }}>Appearance</Text><Text variant="muted" style={{ color: activeColors.foregroundMuted }}>Dark, light, or system preference</Text></View><MobileThemeControl showLabel /></View>
      <View style={styles.card}>
        <Text variant="subtitle">SALORA Guest</Text>
        <Text variant="muted" style={styles.copy}>Customer identity, preferences, loyalty, and order history placeholders are ready for Supabase auth and customer tables.</Text>
      </View>
      <View style={styles.row}>
        <Panel title="Preferences" copy="Matcha, light sweetness, dessert pairing." />
        <Panel title="History" copy="Future orders will appear here." />
      </View>
      <Link href="/loyalty" asChild><Button>Open loyalty preview</Button></Link>
    </Screen>
  );
}

function Panel({ title, copy }: { title: string; copy: string }) {
  return (
    <View style={styles.panel}>
      <Text variant="eyebrow">{title}</Text>
      <Text variant="muted" style={styles.copy}>{copy}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.sm, marginBottom: spacing.lg },
  appearance: { minHeight: 72, borderRadius: radii.md, padding: spacing.md, borderWidth: 1, marginBottom: spacing.md, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
  card: {
    borderRadius: radii.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "rgba(245,239,227,0.1)",
    marginBottom: spacing.md
  },
  copy: { marginTop: spacing.sm },
  row: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.lg
  },
  panel: {
    flex: 1,
    minHeight: 130,
    borderRadius: radii.md,
    padding: spacing.md,
    backgroundColor: "rgba(245,239,227,0.045)"
  }
});
