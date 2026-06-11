import { StyleSheet, View } from "react-native";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { colors, radii, spacing } from "@/lib/theme";

export default function LoyaltyScreen() {
  return (
    <Screen>
      <Text variant="eyebrow">Loyalty preview</Text>
      <Text variant="title" style={styles.title}>A future VIP layer.</Text>
      <View style={styles.points}>
        <Text variant="eyebrow">Preview balance</Text>
        <Text style={styles.number}>420</Text>
        <Text variant="muted">points prepared for future orders and reward rules.</Text>
      </View>
      {["Free signature upgrade", "Dessert pairing reward", "Private tasting status"].map((reward) => (
        <View key={reward} style={styles.reward}>
          <Text variant="subtitle">{reward}</Text>
          <Text variant="muted">Locked until Phase 2 loyalty engine.</Text>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.sm, marginBottom: spacing.lg },
  points: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    backgroundColor: "rgba(201,164,92,0.1)",
    borderWidth: 1,
    borderColor: "rgba(201,164,92,0.2)",
    marginBottom: spacing.lg
  },
  number: {
    color: colors.goldSoft,
    fontSize: 62,
    fontWeight: "800",
    marginVertical: spacing.sm
  },
  reward: {
    borderRadius: radii.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    marginBottom: spacing.md
  }
});
