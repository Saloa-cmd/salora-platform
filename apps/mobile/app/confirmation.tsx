import { useLocalSearchParams } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { colors, radii, spacing } from "@/lib/theme";

const steps = ["received", "preparing", "ready"];

export default function ConfirmationScreen() {
  const { message, url } = useLocalSearchParams<{ message?: string; url?: string }>();

  return (
    <Screen>
      <Text variant="eyebrow">Mock confirmation</Text>
      <Text variant="title" style={styles.title}>Order timeline</Text>
      <View style={styles.timeline}>
        {steps.map((step, index) => (
          <View key={step} style={styles.step}>
            <View style={[styles.dot, index === 0 && styles.activeDot]} />
            <View>
              <Text variant="subtitle" style={styles.stepTitle}>{step}</Text>
              <Text variant="muted">{index === 0 ? "Local mock order created." : "Prepared for future live order updates."}</Text>
            </View>
          </View>
        ))}
      </View>
      <View style={styles.card}>
        <Text variant="eyebrow">WhatsApp-ready summary</Text>
        <Text variant="muted" style={styles.message}>{message || "No message generated."}</Text>
        <Text variant="muted" style={styles.url}>{url || "WhatsApp URL placeholder will appear after checkout."}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.sm, marginBottom: spacing.lg },
  timeline: {
    gap: spacing.lg,
    marginBottom: spacing.lg
  },
  step: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start"
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.muted,
    marginTop: 5
  },
  activeDot: {
    backgroundColor: colors.gold,
    borderColor: colors.gold
  },
  stepTitle: {
    textTransform: "capitalize"
  },
  card: {
    borderRadius: radii.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "rgba(245,239,227,0.1)"
  },
  message: { marginTop: spacing.md },
  url: { marginTop: spacing.md, color: colors.goldSoft }
});
