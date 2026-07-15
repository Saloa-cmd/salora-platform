import { Image, StyleSheet, View } from "react-native";
import { colors, radii, spacing } from "@/lib/theme";
import { Text } from "./Text";

type BrandHeaderProps = {
  eyebrow?: string;
  title?: string;
  copy?: string;
};

export function BrandHeader({ eyebrow = "سالورا", title, copy }: BrandHeaderProps) {
  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/brand/salora-logo-dark.jpeg")}
        accessibilityLabel="شعار سالورا"
        style={styles.logo}
        resizeMode="cover"
      />
      <View style={styles.content}>
        <Text variant="eyebrow" style={styles.eyebrow}>{eyebrow}</Text>
        {title ? <Text variant="title" style={styles.title}>{title}</Text> : null}
        {copy ? <Text variant="muted" style={styles.copy}>{copy}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: "rgba(201,164,92,0.07)",
    borderWidth: 1,
    borderColor: "rgba(201,164,92,0.24)"
  },
  logo: {
    width: 88,
    height: 88,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "rgba(201,164,92,0.42)",
    backgroundColor: colors.surface
  },
  content: { flex: 1, alignItems: "flex-end" },
  eyebrow: { color: colors.gold, textAlign: "right" },
  title: { marginTop: spacing.xs, textAlign: "right", fontSize: 27 },
  copy: { marginTop: spacing.sm, textAlign: "right", lineHeight: 22 }
});
