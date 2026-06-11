import { StyleSheet, View } from "react-native";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { colors, spacing } from "@/lib/theme";

const sections = [
  { label: "Executive", detail: "Command health and approval inbox" },
  { label: "Content", detail: "Products, pages, banners, menus" },
  { label: "AI", detail: "Providers, prompts, safety, cost" },
  { label: "WhatsApp", detail: "Flows, replies, broadcasts" },
  { label: "Automation", detail: "Triggers, conditions, actions" },
  { label: "Integrations", detail: "Connectors, vault, health" }
];

export default function ExecutiveModeScreen() {
  return (
    <Screen>
      <Text variant="eyebrow">SALORA Control Tower</Text>
      <Text variant="title" style={styles.title}>Executive mobile mode</Text>
      <Text variant="muted" style={styles.copy}>
        Mobile owner operations start as a read-only command map. Write-capable controls should be activated only after tenant-scoped RBAC, approval workflows, audit, and rollback are available on mobile.
      </Text>
      <View style={styles.grid}>
        {sections.map((section) => (
          <View key={section.label} style={styles.card}>
            <Text variant="subtitle" style={styles.cardTitle}>{section.label}</Text>
            <Text variant="muted">{section.detail}</Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    marginTop: spacing.sm
  },
  copy: {
    marginTop: spacing.md
  },
  grid: {
    marginTop: spacing.lg,
    gap: spacing.md
  },
  card: {
    borderWidth: 1,
    borderColor: colors.surfaceRaised,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md
  },
  cardTitle: {
    fontSize: 18,
    marginBottom: spacing.xs
  }
});
