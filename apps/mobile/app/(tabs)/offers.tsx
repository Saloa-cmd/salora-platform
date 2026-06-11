import { StyleSheet, View } from "react-native";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { colors, radii, spacing } from "@/lib/theme";

const offers = [
  ["Matcha Pairing", "Iced Matcha Vanilla with Saffron Milk Cake preview."],
  ["Cold Brew Hour", "Signature Cold Brew with Tiramisu Cup for future campaigns."],
  ["VIP Soft Launch", "Loyalty members receive early access to seasonal desserts."]
];

export default function OffersScreen() {
  return (
    <Screen>
      <Text variant="eyebrow">Offers</Text>
      <Text variant="title" style={styles.title}>Premium offer cards</Text>
      {offers.map(([title, copy]) => (
        <View key={title} style={styles.card}>
          <Text variant="subtitle">{title}</Text>
          <Text variant="muted" style={styles.copy}>{copy}</Text>
          <Text variant="price">Limited-time structure ready</Text>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.sm, marginBottom: spacing.lg },
  card: {
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "rgba(201,164,92,0.16)"
  },
  copy: { marginVertical: spacing.md }
});
